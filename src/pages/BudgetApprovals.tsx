import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useBudgetSubmissions } from '@/hooks/useBudgetSubmissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileCheck, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { SubmissionReviewDialog } from '@/components/budget/SubmissionReviewDialog';
import { useNavigate } from 'react-router-dom';

const BudgetApprovals = () => {
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState(2026);
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const { data: userData } = useCurrentUserRole();
  const { data: submissions, isLoading } = useBudgetSubmissions(fiscalYear, statusFilter);

  // Buscar todas as unidades e identificar quais têm submissões
  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ['organizational-units-with-flags', fiscalYear],
    queryFn: async () => {
      // 1. Buscar todas as unidades
      const { data: allUnits, error: unitsError } = await supabase
        .from('organizational_structure')
        .select('id, code, description, type')
        .in('type', ['area', 'department', 'sector', 'project'])
        .order('code');
      
      if (unitsError) throw unitsError;
      if (!allUnits) return [];

      // 2. Buscar IDs das unidades que têm submissões no ano fiscal
      const { data: submissionsData } = await supabase
        .from('budget_submissions')
        .select('unit_id')
        .eq('fiscal_year', fiscalYear);
      
      const unitIdsWithSubmissions = new Set(
        submissionsData?.map(s => s.unit_id).filter(Boolean) || []
      );

      // 3. Adicionar flag 'hasSubmissions' em cada unidade
      return allUnits.map(unit => ({
        ...unit,
        hasSubmissions: unitIdsWithSubmissions.has(unit.id)
      }));
    },
  });

  // Aplicar filtro de unidade
  const filteredSubmissions = submissions?.filter(sub => {
    if (unitFilter === 'all') return true;
    return sub.unit_id === unitFilter;
  }) || [];

  // Verificar permissão
  if (!userData?.isAdmin && !userData?.isHR) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Apenas RH Managers e Admins podem acessar aprovações de orçamento.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calcular totais consolidados usando submissões filtradas
  const totalPending = filteredSubmissions.filter(s => s.status === 'submitted').length || 0;
  const totalApproved = filteredSubmissions.filter(s => s.status === 'approved').length || 0;
  const totalBudget = filteredSubmissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + (s.totalAnnual || 0), 0) || 0;

  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto p-6">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Aprovações de Orçamento</h1>
          <p className="text-muted-foreground">
            Revise e aprove os orçamentos submetidos pelas unidades
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">Aguardando revisão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApproved}</div>
            <p className="text-xs text-muted-foreground">Orçamentos aprovados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Aprovado</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                .format(totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">Valor anual consolidado</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">Ano Fiscal</label>
              <Select
                value={fiscalYear.toString()}
                onValueChange={(v) => setFiscalYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="submitted">⏳ Pendentes</SelectItem>
                  <SelectItem value="approved">✅ Aprovados</SelectItem>
                  <SelectItem value="rejected">❌ Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">Unidade</label>
              {unitsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🏢 Todas as Unidades</SelectItem>
                    {units?.map((unit) => (
                      <SelectItem 
                        key={unit.id} 
                        value={unit.id}
                        className={unit.hasSubmissions ? "font-semibold" : "text-muted-foreground"}
                      >
                        <div className="flex items-center gap-2">
                          {unit.hasSubmissions && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          <span>{unit.code} - {unit.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabela de Submissões */}
      <Card>
        <CardHeader>
          <CardTitle>Submissões de Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredSubmissions && filteredSubmissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submetido Por</TableHead>
                  <TableHead>Data Submissão</TableHead>
                  <TableHead>Revisado Por</TableHead>
                  <TableHead>Total Anual</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.unit?.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(sub.status)}>
                        {getStatusLabel(sub.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.submitted_by_profile?.full_name || 'N/A'}</TableCell>
                    <TableCell>{formatDate(sub.submitted_at)}</TableCell>
                    <TableCell>{sub.reviewed_by_profile?.full_name || '-'}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(sub.totalAnnual || 0)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSubmissionId(sub.id)}
                      >
                        Revisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {unitFilter !== 'all' 
                ? 'Nenhuma submissão encontrada para a unidade selecionada'
                : 'Nenhuma submissão encontrada para os filtros selecionados'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Revisão */}
      {selectedSubmissionId && (
        <SubmissionReviewDialog
          submissionId={selectedSubmissionId}
          open={!!selectedSubmissionId}
          onOpenChange={(open) => !open && setSelectedSubmissionId(null)}
        />
      )}
    </div>
  );
};

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: 'secondary',
    submitted: 'default',
    approved: 'outline',
    rejected: 'destructive',
  };
  return variants[status] || 'secondary';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: '📝 Rascunho',
    submitted: '⏳ Pendente',
    approved: '✅ Aprovado',
    rejected: '❌ Rejeitado',
  };
  return labels[status] || status;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

export default BudgetApprovals;
