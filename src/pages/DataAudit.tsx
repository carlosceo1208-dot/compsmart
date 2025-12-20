import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Users, 
  Wrench,
  Mail,
  CreditCard,
  Briefcase,
  DollarSign,
  FileWarning,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Interface para funcionário com inconsistência de unidade
interface InconsistentEmployee {
  id: string;
  full_name: string;
  email: string | null;
  unit_id: string | null;
  root_company_id: string | null;
  unit_name: string | null;
  unit_company_id: string | null;
  issue_type: 'different_company' | 'invalid_unit';
}

// Interface para resumo da auditoria
interface AuditSummary {
  total_employees: number;
  employees_with_unit: number;
  employees_without_unit: number;
  company_count: number;
}

// Interface para funcionário com problema
interface ProblemEmployee {
  id: string;
  full_name: string;
  email: string | null;
  cpf: string | null;
  grade: string | null;
  salary: number | null;
  hire_date: string | null;
  job_title_id: string | null;
  job_title: string | null;
  status: string;
  manager_id: string | null;
}

// Interface para email/CPF duplicado
interface DuplicateItem {
  value: string;
  count: number;
  employees: { id: string; full_name: string }[];
}

// Função para validar CPF brasileiro
function validateCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  // Remove formatação
  const cleaned = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;
  if (digit1 !== parseInt(cleaned[9])) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;
  return digit2 === parseInt(cleaned[10]);
}

// Função para formatar CPF
function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

export default function DataAudit() {
  const [activeTab, setActiveTab] = useState('summary');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Query para resumo geral
  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['audit-summary'],
    queryFn: async (): Promise<AuditSummary> => {
      const { data: employees, error } = await supabase
        .from('profiles')
        .select('id, unit_id, root_company_id');
      
      if (error) throw error;

      const { data: companies, error: companyError } = await supabase
        .from('organizational_structure')
        .select('id')
        .eq('type', 'company');
      
      if (companyError) throw companyError;

      return {
        total_employees: employees?.length || 0,
        employees_with_unit: employees?.filter(e => e.unit_id).length || 0,
        employees_without_unit: employees?.filter(e => !e.unit_id).length || 0,
        company_count: companies?.length || 0
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  // Query para funcionários inconsistentes (unidade de outra empresa)
  const { data: inconsistentEmployees, isLoading: loadingInconsistent, refetch: refetchInconsistent } = useQuery({
    queryKey: ['audit-inconsistent-employees'],
    queryFn: async (): Promise<InconsistentEmployee[]> => {
      const { data: employees, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          unit_id,
          root_company_id,
          organizational_structure!profiles_position_id_fkey (
            id,
            name,
            root_company_id
          )
        `)
        .not('unit_id', 'is', null);
      
      if (error) throw error;

      const inconsistent: InconsistentEmployee[] = [];
      
      employees?.forEach((emp: any) => {
        const unit = emp.organizational_structure;
        if (!unit) {
          inconsistent.push({
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            unit_id: emp.unit_id,
            root_company_id: emp.root_company_id,
            unit_name: null,
            unit_company_id: null,
            issue_type: 'invalid_unit'
          });
        } else if (unit.root_company_id !== emp.root_company_id) {
          inconsistent.push({
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            unit_id: emp.unit_id,
            root_company_id: emp.root_company_id,
            unit_name: unit.name,
            unit_company_id: unit.root_company_id,
            issue_type: 'different_company'
          });
        }
      });

      return inconsistent;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Query para todos os funcionários (para validações)
  const { data: allEmployees, isLoading: loadingEmployees, refetch: refetchEmployees } = useQuery({
    queryKey: ['audit-all-employees'],
    queryFn: async (): Promise<ProblemEmployee[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          cpf,
          grade,
          salary,
          hire_date,
          job_title_id,
          job_title,
          status,
          manager_id
        `)
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Calcular problemas de email
  const emailProblems = {
    missing: allEmployees?.filter(e => !e.email || e.email.trim() === '') || [],
    duplicates: (() => {
      if (!allEmployees) return [];
      const emailMap = new Map<string, ProblemEmployee[]>();
      allEmployees.forEach(e => {
        if (e.email && e.email.trim()) {
          const email = e.email.toLowerCase().trim();
          if (!emailMap.has(email)) emailMap.set(email, []);
          emailMap.get(email)!.push(e);
        }
      });
      const duplicates: DuplicateItem[] = [];
      emailMap.forEach((employees, email) => {
        if (employees.length > 1) {
          duplicates.push({
            value: email,
            count: employees.length,
            employees: employees.map(e => ({ id: e.id, full_name: e.full_name }))
          });
        }
      });
      return duplicates;
    })()
  };

  // Calcular problemas de CPF
  const cpfProblems = {
    missing: allEmployees?.filter(e => !e.cpf || e.cpf.trim() === '') || [],
    invalid: allEmployees?.filter(e => e.cpf && e.cpf.trim() !== '' && !validateCPF(e.cpf)) || [],
    duplicates: (() => {
      if (!allEmployees) return [];
      const cpfMap = new Map<string, ProblemEmployee[]>();
      allEmployees.forEach(e => {
        if (e.cpf && e.cpf.trim()) {
          const cpf = e.cpf.replace(/\D/g, '');
          if (cpf.length === 11) {
            if (!cpfMap.has(cpf)) cpfMap.set(cpf, []);
            cpfMap.get(cpf)!.push(e);
          }
        }
      });
      const duplicates: DuplicateItem[] = [];
      cpfMap.forEach((employees, cpf) => {
        if (employees.length > 1) {
          duplicates.push({
            value: formatCPF(cpf),
            count: employees.length,
            employees: employees.map(e => ({ id: e.id, full_name: e.full_name }))
          });
        }
      });
      return duplicates;
    })()
  };

  // Funcionários ativos sem cargo
  const employeesWithoutJobTitle = allEmployees?.filter(e => 
    e.status === 'active' && !e.job_title_id
  ) || [];

  // Funcionários ativos sem salário
  const employeesWithoutSalary = allEmployees?.filter(e => 
    e.status === 'active' && (!e.salary || e.salary === 0)
  ) || [];

  // Funcionários com dados incompletos
  const incompleteData = {
    noGrade: allEmployees?.filter(e => e.status === 'active' && (!e.grade || e.grade.trim() === '')) || [],
    noHireDate: allEmployees?.filter(e => e.status === 'active' && !e.hire_date) || [],
    noManager: allEmployees?.filter(e => e.status === 'active' && !e.manager_id) || []
  };

  // Total de problemas
  const totalProblems = 
    (inconsistentEmployees?.length || 0) +
    emailProblems.missing.length +
    emailProblems.duplicates.reduce((acc, d) => acc + d.count, 0) +
    cpfProblems.invalid.length +
    cpfProblems.duplicates.reduce((acc, d) => acc + d.count, 0) +
    employeesWithoutJobTitle.length +
    employeesWithoutSalary.length;

  const isLoading = loadingSummary || loadingInconsistent || loadingEmployees;

  // Mutation para corrigir inconsistência de unidade
  const fixUnitMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ unit_id: null })
        .eq('id', employeeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audit-inconsistent-employees'] });
      queryClient.invalidateQueries({ queryKey: ['audit-all-employees'] });
      toast.success('Unidade removida com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao corrigir: ' + error.message);
    }
  });

  // Mutation para corrigir todas as inconsistências de unidade
  const fixAllMutation = useMutation({
    mutationFn: async () => {
      if (!inconsistentEmployees || inconsistentEmployees.length === 0) return;
      
      const ids = inconsistentEmployees.map(e => e.id);
      const { error } = await supabase
        .from('profiles')
        .update({ unit_id: null })
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audit-inconsistent-employees'] });
      queryClient.invalidateQueries({ queryKey: ['audit-all-employees'] });
      toast.success('Todas as inconsistências de unidade foram corrigidas');
    },
    onError: (error) => {
      toast.error('Erro ao corrigir: ' + error.message);
    }
  });

  // Função para atualizar todos os dados
  const handleRefresh = () => {
    refetchSummary();
    refetchInconsistent();
    refetchEmployees();
    toast.success('Dados atualizados');
  };

  // Função para exportar relatório
  const exportReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        ...summary,
        total_problems: totalProblems
      },
      inconsistent_units: inconsistentEmployees,
      email_problems: {
        missing: emailProblems.missing.map(e => ({ id: e.id, full_name: e.full_name })),
        duplicates: emailProblems.duplicates
      },
      cpf_problems: {
        missing_count: cpfProblems.missing.length,
        invalid: cpfProblems.invalid.map(e => ({ id: e.id, full_name: e.full_name, cpf: e.cpf })),
        duplicates: cpfProblems.duplicates
      },
      missing_job_title: employeesWithoutJobTitle.map(e => ({ id: e.id, full_name: e.full_name, email: e.email })),
      missing_salary: employeesWithoutSalary.map(e => ({ id: e.id, full_name: e.full_name, email: e.email })),
      incomplete_data: {
        no_grade: incompleteData.noGrade.map(e => ({ id: e.id, full_name: e.full_name })),
        no_hire_date: incompleteData.noHireDate.map(e => ({ id: e.id, full_name: e.full_name })),
        no_manager: incompleteData.noManager.map(e => ({ id: e.id, full_name: e.full_name }))
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-dados-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado');
  };

  const navigateToEmployee = (employeeId: string) => {
    navigate(`/employees?edit=${employeeId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Auditoria de Dados</h1>
            <p className="text-muted-foreground">
              Verificação de consistência e qualidade dos dados de funcionários
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={exportReport} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{summary?.total_employees || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problemas de Email</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {emailProblems.missing.length + emailProblems.duplicates.length > 0 ? (
                    <span className="text-amber-600">
                      {emailProblems.missing.length + emailProblems.duplicates.length}
                    </span>
                  ) : (
                    <span className="text-emerald-600">0</span>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {emailProblems.missing.length} sem email, {emailProblems.duplicates.length} duplicados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problemas de CPF</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {cpfProblems.invalid.length + cpfProblems.duplicates.length > 0 ? (
                    <span className="text-amber-600">
                      {cpfProblems.invalid.length + cpfProblems.duplicates.length}
                    </span>
                  ) : (
                    <span className="text-emerald-600">0</span>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {cpfProblems.invalid.length} inválidos, {cpfProblems.duplicates.length} duplicados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem Cargo/Salário</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {employeesWithoutJobTitle.length + employeesWithoutSalary.length > 0 ? (
                    <span className="text-amber-600">
                      {employeesWithoutJobTitle.length + employeesWithoutSalary.length}
                    </span>
                  ) : (
                    <span className="text-emerald-600">0</span>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {employeesWithoutJobTitle.length} sem cargo, {employeesWithoutSalary.length} sem salário
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unidades Inconsistentes</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingInconsistent ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {(inconsistentEmployees?.length || 0) > 0 ? (
                    <span className="text-destructive">{inconsistentEmployees?.length}</span>
                  ) : (
                    <span className="text-emerald-600">0</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerta de Status */}
        {!isLoading && (
          totalProblems === 0 ? (
            <Alert className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-700 dark:text-emerald-400">Dados Consistentes</AlertTitle>
              <AlertDescription className="text-emerald-600 dark:text-emerald-300">
                Nenhum problema de consistência detectado nos dados.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-700 dark:text-amber-400">Problemas Detectados</AlertTitle>
              <AlertDescription className="text-amber-600 dark:text-amber-300">
                Foram encontrados {totalProblems} problemas nos dados. Revise as abas abaixo para detalhes.
              </AlertDescription>
            </Alert>
          )
        )}

        {/* Tabs de Detalhes */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="units">
              Unidades
              {(inconsistentEmployees?.length || 0) > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{inconsistentEmployees?.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="emails">
              Emails
              {(emailProblems.missing.length + emailProblems.duplicates.length) > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 text-amber-700">
                  {emailProblems.missing.length + emailProblems.duplicates.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cpfs">
              CPFs
              {(cpfProblems.invalid.length + cpfProblems.duplicates.length) > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 text-amber-700">
                  {cpfProblems.invalid.length + cpfProblems.duplicates.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="jobs">
              Cargos
              {employeesWithoutJobTitle.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 text-amber-700">
                  {employeesWithoutJobTitle.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="salaries">
              Salários
              {employeesWithoutSalary.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 text-amber-700">
                  {employeesWithoutSalary.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="incomplete">
              Incompletos
              {(incompleteData.noGrade.length + incompleteData.noHireDate.length) > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 text-amber-700">
                  {incompleteData.noGrade.length + incompleteData.noHireDate.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Resumo */}
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Auditoria</CardTitle>
                <CardDescription>Visão geral dos dados e problemas encontrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="font-medium">Funcionários</span>
                    </div>
                    <div className="text-2xl font-bold">{summary?.total_employees || 0}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {summary?.employees_with_unit || 0} com unidade • {summary?.employees_without_unit || 0} sem unidade
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-5 w-5 text-primary" />
                      <span className="font-medium">Emails</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {emailProblems.missing.length + emailProblems.duplicates.length === 0 ? (
                        <span className="text-emerald-600">OK</span>
                      ) : (
                        <span className="text-amber-600">{emailProblems.missing.length + emailProblems.duplicates.length} problemas</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {emailProblems.missing.length} ausentes • {emailProblems.duplicates.length} duplicados
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span className="font-medium">CPFs</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {cpfProblems.invalid.length + cpfProblems.duplicates.length === 0 ? (
                        <span className="text-emerald-600">OK</span>
                      ) : (
                        <span className="text-amber-600">{cpfProblems.invalid.length + cpfProblems.duplicates.length} problemas</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cpfProblems.missing.length} ausentes • {cpfProblems.invalid.length} inválidos • {cpfProblems.duplicates.length} duplicados
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <span className="font-medium">Cargos</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {employeesWithoutJobTitle.length === 0 ? (
                        <span className="text-emerald-600">OK</span>
                      ) : (
                        <span className="text-amber-600">{employeesWithoutJobTitle.length} sem cargo</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Funcionários ativos sem cargo vinculado
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="font-medium">Salários</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {employeesWithoutSalary.length === 0 ? (
                        <span className="text-emerald-600">OK</span>
                      ) : (
                        <span className="text-amber-600">{employeesWithoutSalary.length} sem salário</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Funcionários ativos sem salário definido
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileWarning className="h-5 w-5 text-primary" />
                      <span className="font-medium">Dados Incompletos</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {incompleteData.noGrade.length + incompleteData.noHireDate.length === 0 ? (
                        <span className="text-emerald-600">OK</span>
                      ) : (
                        <span className="text-amber-600">
                          {incompleteData.noGrade.length + incompleteData.noHireDate.length} problemas
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {incompleteData.noGrade.length} sem grade • {incompleteData.noHireDate.length} sem data admissão
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Unidades Inconsistentes */}
          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Inconsistências de Unidade</CardTitle>
                  <CardDescription>
                    Funcionários com unidade vinculada a outra empresa ou unidade inválida
                  </CardDescription>
                </div>
                {(inconsistentEmployees?.length || 0) > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => fixAllMutation.mutate()}
                    disabled={fixAllMutation.isPending}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Corrigir Todos
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {loadingInconsistent ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (inconsistentEmployees?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
                    <p>Nenhuma inconsistência de unidade encontrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Problema</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inconsistentEmployees?.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.full_name}</TableCell>
                          <TableCell>{employee.email || '-'}</TableCell>
                          <TableCell>{employee.unit_name || 'Unidade não encontrada'}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {employee.issue_type === 'different_company' 
                                ? 'Empresa diferente' 
                                : 'Unidade inválida'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fixUnitMutation.mutate(employee.id)}
                              disabled={fixUnitMutation.isPending}
                            >
                              <Wrench className="mr-2 h-4 w-4" />
                              Corrigir
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

          {/* Tab Emails */}
          <TabsContent value="emails" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Problemas de Email</CardTitle>
                <CardDescription>Emails ausentes ou duplicados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Emails Duplicados */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Emails Duplicados ({emailProblems.duplicates.length})
                  </h4>
                  {emailProblems.duplicates.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhum email duplicado encontrado.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Ocorrências</TableHead>
                          <TableHead>Funcionários</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emailProblems.duplicates.map((dup) => (
                          <TableRow key={dup.value}>
                            <TableCell className="font-medium">{dup.value}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{dup.count}x</Badge>
                            </TableCell>
                            <TableCell>
                              {dup.employees.map(e => e.full_name).join(', ')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => navigateToEmployee(dup.employees[0].id)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Sem Email */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Funcionários sem Email ({emailProblems.missing.length})
                  </h4>
                  {emailProblems.missing.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Todos os funcionários possuem email.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emailProblems.missing.slice(0, 20).map((emp) => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-medium">{emp.full_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{emp.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => navigateToEmployee(emp.id)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {emailProblems.missing.length > 20 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ... e mais {emailProblems.missing.length - 20} funcionários
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab CPFs */}
          <TabsContent value="cpfs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Problemas de CPF</CardTitle>
                <CardDescription>CPFs inválidos ou duplicados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CPFs Inválidos */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    CPFs Inválidos ({cpfProblems.invalid.length})
                  </h4>
                  {cpfProblems.invalid.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Todos os CPFs cadastrados são válidos.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>CPF Informado</TableHead>
                          <TableHead>Problema</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cpfProblems.invalid.map((emp) => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-medium">{emp.full_name}</TableCell>
                            <TableCell className="font-mono">{emp.cpf}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">Dígitos verificadores inválidos</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => navigateToEmployee(emp.id)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* CPFs Duplicados */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-amber-500" />
                    CPFs Duplicados ({cpfProblems.duplicates.length})
                  </h4>
                  {cpfProblems.duplicates.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhum CPF duplicado encontrado.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>CPF</TableHead>
                          <TableHead>Ocorrências</TableHead>
                          <TableHead>Funcionários</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cpfProblems.duplicates.map((dup) => (
                          <TableRow key={dup.value}>
                            <TableCell className="font-mono">{dup.value}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{dup.count}x</Badge>
                            </TableCell>
                            <TableCell>
                              {dup.employees.map(e => e.full_name).join(', ')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => navigateToEmployee(dup.employees[0].id)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Cargos */}
          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Funcionários sem Cargo</CardTitle>
                <CardDescription>Funcionários ativos sem cargo vinculado no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {employeesWithoutJobTitle.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
                    <p>Todos os funcionários ativos possuem cargo vinculado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Cargo (texto)</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeesWithoutJobTitle.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">{emp.full_name}</TableCell>
                          <TableCell>{emp.email || '-'}</TableCell>
                          <TableCell>{emp.job_title || <span className="text-muted-foreground">-</span>}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => navigateToEmployee(emp.id)}>
                              <ExternalLink className="h-4 w-4" />
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

          {/* Tab Salários */}
          <TabsContent value="salaries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Funcionários sem Salário</CardTitle>
                <CardDescription>Funcionários ativos sem salário definido ou com valor zero</CardDescription>
              </CardHeader>
              <CardContent>
                {employeesWithoutSalary.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
                    <p>Todos os funcionários ativos possuem salário definido</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeesWithoutSalary.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">{emp.full_name}</TableCell>
                          <TableCell>{emp.email || '-'}</TableCell>
                          <TableCell>{emp.grade || <span className="text-muted-foreground">-</span>}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => navigateToEmployee(emp.id)}>
                              <ExternalLink className="h-4 w-4" />
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

          {/* Tab Dados Incompletos */}
          <TabsContent value="incomplete" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados Incompletos</CardTitle>
                <CardDescription>Funcionários ativos com campos importantes não preenchidos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sem Grade */}
                <div>
                  <h4 className="font-medium mb-3">Sem Grade ({incompleteData.noGrade.length})</h4>
                  {incompleteData.noGrade.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Todos possuem grade definida.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incompleteData.noGrade.slice(0, 10).map((emp) => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-medium">{emp.full_name}</TableCell>
                            <TableCell>{emp.email || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => navigateToEmployee(emp.id)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {incompleteData.noGrade.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ... e mais {incompleteData.noGrade.length - 10} funcionários
                    </p>
                  )}
                </div>

                {/* Sem Data de Admissão */}
                <div>
                  <h4 className="font-medium mb-3">Sem Data de Admissão ({incompleteData.noHireDate.length})</h4>
                  {incompleteData.noHireDate.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Todos possuem data de admissão.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incompleteData.noHireDate.slice(0, 10).map((emp) => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-medium">{emp.full_name}</TableCell>
                            <TableCell>{emp.email || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => navigateToEmployee(emp.id)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {incompleteData.noHireDate.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ... e mais {incompleteData.noHireDate.length - 10} funcionários
                    </p>
                  )}
                </div>

                {/* Sem Gestor */}
                <div>
                  <h4 className="font-medium mb-3">Sem Gestor ({incompleteData.noManager.length})</h4>
                  {incompleteData.noManager.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Todos possuem gestor definido.</p>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      <p>{incompleteData.noManager.length} funcionários ativos sem gestor vinculado.</p>
                      <p className="mt-1">Esta é uma informação comum para cargos de diretoria ou proprietários.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
