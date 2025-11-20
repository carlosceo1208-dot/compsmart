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
import { FileCheck, Clock, CheckCircle, AlertCircle, ArrowLeft, FileSpreadsheet, FileText, Mail } from 'lucide-react';
import { SubmissionReviewDialog } from '@/components/budget/SubmissionReviewDialog';
import { SendReportDialog } from '@/components/budget/SendReportDialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BudgetApprovals = () => {
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState(2026);
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [showSendReportDialog, setShowSendReportDialog] = useState(false);

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

  // Funções de exportação
  const exportToExcel = () => {
    try {
      const exportData = filteredSubmissions.map(sub => ({
        'Unidade': sub.unit?.description || 'N/A',
        'Status': getStatusLabel(sub.status),
        'Submetido Por': sub.submitted_by_profile?.full_name || 'N/A',
        'Data Submissão': formatDate(sub.submitted_at),
        'Revisado Por': sub.reviewed_by_profile?.full_name || '-',
        'Total Anual': formatCurrency(sub.totalAnnual || 0),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Aprovações');
      
      // Configurar largura das colunas
      ws['!cols'] = [
        { wch: 30 }, // Unidade
        { wch: 15 }, // Status
        { wch: 25 }, // Submetido Por
        { wch: 15 }, // Data Submissão
        { wch: 25 }, // Revisado Por
        { wch: 18 }, // Total Anual
      ];
      
      const fileName = `aprovacoes_orcamento_${fiscalYear}_${statusFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Relatório Excel exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório Excel');
      console.error(error);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(16);
      doc.text('Aprovações de Orçamento', 14, 15);
      
      // Informações do filtro
      doc.setFontSize(10);
      doc.text(`Ano Fiscal: ${fiscalYear}`, 14, 25);
      doc.text(`Status: ${statusFilter === 'all' ? 'Todos' : getStatusLabel(statusFilter)}`, 14, 30);
      if (unitFilter !== 'all') {
        const selectedUnit = units?.find(u => u.id === unitFilter);
        doc.text(`Unidade: ${selectedUnit?.description || ''}`, 14, 35);
      }
      
      // Tabela
      const tableData = filteredSubmissions.map(sub => [
        sub.unit?.description || 'N/A',
        getStatusLabel(sub.status),
        sub.submitted_by_profile?.full_name || 'N/A',
        formatDate(sub.submitted_at),
        sub.reviewed_by_profile?.full_name || '-',
        formatCurrency(sub.totalAnnual || 0),
      ]);

      (doc as any).autoTable({
        head: [['Unidade', 'Status', 'Submetido Por', 'Data', 'Revisado Por', 'Total Anual']],
        body: tableData,
        startY: unitFilter !== 'all' ? 40 : 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });
      
      const fileName = `aprovacoes_orcamento_${fiscalYear}_${statusFilter}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório PDF');
      console.error(error);
    }
  };

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
          <div className="flex items-center justify-between">
            <CardTitle>Submissões de Orçamento</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={!filteredSubmissions || filteredSubmissions.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                disabled={!filteredSubmissions || filteredSubmissions.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSendReportDialog(true)}
                disabled={!filteredSubmissions || filteredSubmissions.length === 0}
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar por Email
              </Button>
            </div>
          </div>
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

      {/* Modal de Envio de Email */}
      <SendReportDialog
        open={showSendReportDialog}
        onOpenChange={setShowSendReportDialog}
        reportData={{
          fiscalYear,
          statusFilter,
          unitFilter,
          totalPending,
          totalApproved,
          totalBudget,
          submissions: filteredSubmissions.map(sub => ({
            unitName: sub.unit?.description || 'N/A',
            status: getStatusLabel(sub.status),
            submittedBy: sub.submitted_by_profile?.full_name || 'N/A',
            submittedAt: formatDate(sub.submitted_at),
            reviewedBy: sub.reviewed_by_profile?.full_name || '-',
            totalAnnual: sub.totalAnnual || 0,
          })),
        }}
      />
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
