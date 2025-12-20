import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, RefreshCw, Download, Trash2, Users, Building2, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InconsistentEmployee {
  id: string;
  full_name: string;
  email: string | null;
  grade: string | null;
  root_company_id: string | null;
  root_company_name: string | null;
  unit_id: string | null;
  unit_name: string | null;
  unit_company_id: string | null;
  unit_company_name: string | null;
  issue_type: 'wrong_company' | 'orphan_unit' | 'no_unit' | 'no_company';
}

interface AuditSummary {
  total_employees: number;
  employees_with_unit: number;
  employees_without_unit: number;
  inconsistent_units: number;
  orphan_units: number;
  companies_count: number;
}

export default function DataAudit() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("summary");

  // Fetch audit summary
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['data-audit-summary'],
    queryFn: async (): Promise<AuditSummary> => {
      const [
        { count: totalEmployees },
        { count: withUnit },
        { count: withoutUnit },
        { count: companies }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).not('unit_id', 'is', null),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).is('unit_id', null),
        supabase.from('organizational_structure').select('*', { count: 'exact', head: true }).eq('type', 'company')
      ]);

      return {
        total_employees: totalEmployees || 0,
        employees_with_unit: withUnit || 0,
        employees_without_unit: withoutUnit || 0,
        inconsistent_units: 0, // Será calculado pela query de inconsistentes
        orphan_units: 0,
        companies_count: companies || 0
      };
    }
  });

  // Fetch inconsistent employees
  const { data: inconsistentEmployees, isLoading: loadingInconsistent, refetch: refetchInconsistent } = useQuery({
    queryKey: ['data-audit-inconsistent'],
    queryFn: async (): Promise<InconsistentEmployee[]> => {
      // Buscar funcionários com unit_id
      const { data: employees, error } = await supabase
        .from('profiles')
        .select(`
          id, full_name, email, grade, root_company_id, unit_id
        `)
        .not('unit_id', 'is', null)
        .not('root_company_id', 'is', null);

      if (error) throw error;

      const inconsistent: InconsistentEmployee[] = [];

      for (const emp of employees || []) {
        // Buscar a empresa do funcionário
        const { data: rootCompanyData } = await supabase
          .from('organizational_structure')
          .select('id, name')
          .eq('id', emp.root_company_id as string)
          .single();

        // Buscar a unidade do funcionário
        const { data: unitData } = await supabase
          .from('organizational_structure')
          .select('id, name, root_company_id')
          .eq('id', emp.unit_id as string)
          .single();

        if (!unitData) {
          // Unidade não existe mais (órfã)
          inconsistent.push({
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            grade: emp.grade,
            root_company_id: emp.root_company_id,
            root_company_name: rootCompanyData?.name || 'Desconhecida',
            unit_id: emp.unit_id,
            unit_name: 'UNIDADE NÃO ENCONTRADA',
            unit_company_id: null,
            unit_company_name: null,
            issue_type: 'orphan_unit'
          });
        } else if (unitData.root_company_id !== emp.root_company_id) {
          // Unidade de outra empresa
          const { data: unitCompany } = await supabase
            .from('organizational_structure')
            .select('name')
            .eq('id', unitData.root_company_id as string)
            .single();

          inconsistent.push({
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            grade: emp.grade,
            root_company_id: emp.root_company_id,
            root_company_name: rootCompanyData?.name || 'Desconhecida',
            unit_id: emp.unit_id,
            unit_name: unitData.name,
            unit_company_id: unitData.root_company_id,
            unit_company_name: unitCompany?.name || 'Desconhecida',
            issue_type: 'wrong_company'
          });
        }
      }

      return inconsistent;
    }
  });

  // Fetch employees without unit
  const { data: employeesWithoutUnit, isLoading: loadingWithoutUnit } = useQuery({
    queryKey: ['data-audit-no-unit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, full_name, email, grade, root_company_id,
          root_company:organizational_structure!profiles_root_company_id_fkey(id, name)
        `)
        .is('unit_id', null)
        .order('full_name');

      if (error) throw error;
      return data || [];
    }
  });

  // Mutation to fix inconsistent unit
  const fixUnitMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ unit_id: null })
        .eq('id', employeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-audit-inconsistent'] });
      queryClient.invalidateQueries({ queryKey: ['data-audit-summary'] });
      toast.success("Unidade removida do funcionário");
    },
    onError: () => {
      toast.error("Erro ao corrigir funcionário");
    }
  });

  // Mutation to fix all inconsistent units
  const fixAllMutation = useMutation({
    mutationFn: async () => {
      const employeeIds = inconsistentEmployees?.map(e => e.id) || [];
      for (const id of employeeIds) {
        const { error } = await supabase
          .from('profiles')
          .update({ unit_id: null })
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-audit-inconsistent'] });
      queryClient.invalidateQueries({ queryKey: ['data-audit-summary'] });
      toast.success("Todas as inconsistências foram corrigidas");
    },
    onError: () => {
      toast.error("Erro ao corrigir inconsistências");
    }
  });

  const exportReport = () => {
    const report = {
      summary,
      inconsistentEmployees,
      employeesWithoutUnit: employeesWithoutUnit?.map(e => ({
        id: e.id,
        name: e.full_name,
        email: e.email,
        company: (e.root_company as { name: string } | null)?.name
      })),
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-dados-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado com sucesso");
  };

  const isLoading = loadingSummary || loadingInconsistent || loadingWithoutUnit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria de Dados</h1>
          <p className="text-muted-foreground">
            Verifique inconsistências entre funcionários e estrutura organizacional
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['data-audit-summary'] });
              refetchInconsistent();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.total_employees || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Com Unidade</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{summary?.employees_with_unit || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sem Unidade</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">{summary?.employees_without_unit || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inconsistentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingInconsistent ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{inconsistentEmployees?.length || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {!isLoading && (inconsistentEmployees?.length || 0) === 0 && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Dados Consistentes</AlertTitle>
          <AlertDescription>
            Não há inconsistências entre funcionários e estrutura organizacional.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && (inconsistentEmployees?.length || 0) > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Inconsistências Detectadas</AlertTitle>
          <AlertDescription>
            {inconsistentEmployees?.length} funcionário(s) com unidade de empresa diferente.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="inconsistent">
            Inconsistentes
            {(inconsistentEmployees?.length || 0) > 0 && (
              <Badge variant="destructive" className="ml-2">{inconsistentEmployees?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="no-unit">
            Sem Unidade
            <Badge variant="secondary" className="ml-2">{employeesWithoutUnit?.length || 0}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral do Sistema</CardTitle>
              <CardDescription>
                Estatísticas de integridade dos dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Empresas</div>
                  <div className="text-xl font-bold">{summary?.companies_count || 0}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Funcionários</div>
                  <div className="text-xl font-bold">{summary?.total_employees || 0}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Alocados</div>
                  <div className="text-xl font-bold text-green-600">{summary?.employees_with_unit || 0}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Pendentes</div>
                  <div className="text-xl font-bold text-amber-600">{summary?.employees_without_unit || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inconsistent" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Funcionários com Unidade Inconsistente</CardTitle>
                <CardDescription>
                  Funcionários cujo unit_id aponta para unidade de outra empresa
                </CardDescription>
              </div>
              {(inconsistentEmployees?.length || 0) > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={() => fixAllMutation.mutate()}
                  disabled={fixAllMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Corrigir Todos
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loadingInconsistent ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (inconsistentEmployees?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Nenhuma inconsistência encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Unidade Atual</TableHead>
                      <TableHead>Empresa da Unidade</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead className="w-[100px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inconsistentEmployees?.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <div className="font-medium">{emp.full_name}</div>
                          <div className="text-sm text-muted-foreground">{emp.email}</div>
                        </TableCell>
                        <TableCell>{emp.root_company_name}</TableCell>
                        <TableCell>{emp.unit_name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{emp.unit_company_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={emp.issue_type === 'wrong_company' ? 'destructive' : 'secondary'}>
                            {emp.issue_type === 'wrong_company' ? 'Empresa Diferente' : 'Unidade Órfã'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fixUnitMutation.mutate(emp.id)}
                            disabled={fixUnitMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="no-unit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funcionários Sem Unidade</CardTitle>
              <CardDescription>
                Funcionários que não estão alocados em nenhuma unidade organizacional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWithoutUnit ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (employeesWithoutUnit?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Todos os funcionários estão alocados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Empresa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeesWithoutUnit?.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{emp.email || '-'}</TableCell>
                        <TableCell>{emp.grade || '-'}</TableCell>
                        <TableCell>
                          {(emp.root_company as { name: string } | null)?.name || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
