import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useBudgetSubmissions } from '@/hooks/useBudgetSubmissions';
import { useBudgetDeadline } from '@/hooks/useBudgetDeadline';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileCheck, Clock, CheckCircle, AlertCircle, ArrowLeft, FileSpreadsheet, 
  FileText, Mail, UserCog, AlertTriangle, CalendarIcon, Send, ChevronDown, ChevronUp 
} from 'lucide-react';
import { SubmissionReviewDialog } from '@/components/budget/SubmissionReviewDialog';
import { SendReportDialog } from '@/components/budget/SendReportDialog';
import { ApproversConfigDialog } from '@/components/budget/ApproversConfigDialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BudgetApprovals = () => {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompanyContext();
  const [fiscalYear, setFiscalYear] = useState(2026);
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [showSendReportDialog, setShowSendReportDialog] = useState(false);
  const [showApproversConfig, setShowApproversConfig] = useState(false);
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);
  const [isUnitsListOpen, setIsUnitsListOpen] = useState(false);

  const { data: userData } = useCurrentUserRole();
  const { data: submissions, isLoading } = useBudgetSubmissions(fiscalYear, statusFilter, activeCompanyId);
  const { 
    deadlineData, 
    statsData, 
    isLoading: deadlineLoading, 
    updateDeadline, 
    isUpdating,
    sendReminders,
    isSendingReminders 
  } = useBudgetDeadline(fiscalYear);

  // Buscar todas as unidades e identificar quais têm submissões - FILTRADO POR EMPRESA
  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ['organizational-units-with-flags', fiscalYear, activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      
      const { data: allUnits, error: unitsError } = await supabase
        .from('organizational_structure')
        .select('id, code, description, type')
        .eq('root_company_id', activeCompanyId)
        .in('type', ['area', 'department', 'sector', 'project'])
        .order('code');
      
      if (unitsError) throw unitsError;
      if (!allUnits) return [];

      // Buscar submissões apenas das unidades desta empresa
      const unitIds = allUnits.map(u => u.id);
      const { data: submissionsData } = await supabase
        .from('budget_submissions')
        .select('unit_id')
        .eq('fiscal_year', fiscalYear)
        .in('unit_id', unitIds.length > 0 ? unitIds : ['00000000-0000-0000-0000-000000000000']);
      
      const unitIdsWithSubmissions = new Set(
        submissionsData?.map(s => s.unit_id).filter(Boolean) || []
      );

      return allUnits.map(unit => ({
        ...unit,
        hasSubmissions: unitIdsWithSubmissions.has(unit.id)
      }));
    },
    enabled: !!activeCompanyId,
  });

  // Query separada para KPIs consolidados (independente do filtro de status) - FILTRADO POR EMPRESA
  const { data: kpiData } = useQuery({
    queryKey: ['budget-submissions-kpi', fiscalYear, activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return { totalPending: 0, totalApproved: 0, totalApprovedBudget: 0 };
      
      // Primeiro buscar unidades da empresa ativa
      const { data: companyUnits } = await supabase
        .from('organizational_structure')
        .select('id')
        .eq('root_company_id', activeCompanyId)
        .in('type', ['area', 'department', 'sector', 'project']);
      
      const unitIds = companyUnits?.map(u => u.id) || [];
      
      // Buscar submissões apenas das unidades desta empresa
      const { data: allSubmissions, error } = await supabase
        .from('budget_submissions')
        .select('id, status, unit_id')
        .eq('fiscal_year', fiscalYear)
        .or(`unit_id.in.(${unitIds.length > 0 ? unitIds.join(',') : '00000000-0000-0000-0000-000000000000'}),unit_id.is.null`);
      
      if (error) throw error;
      
      // Filtrar para garantir que submissões "empresa toda" são da empresa correta
      const filteredSubmissions = allSubmissions?.filter(s => 
        s.unit_id === null || unitIds.includes(s.unit_id)
      ) || [];
      
      const pending = filteredSubmissions.filter(s => s.status === 'submitted').length;
      const approved = filteredSubmissions.filter(s => s.status === 'approved');
      
      // Verificar se existe submissão "Empresa toda" aprovada (unit_id = NULL)
      const companyWideApproved = approved.find(s => s.unit_id === null);
      
      let totalApprovedBudget = 0;
      
      if (companyWideApproved) {
        // Se existe "Empresa toda", buscar projeções das unidades da empresa
        const { data: projections } = await supabase
          .from('budget_employee_projections')
          .select('projected_fixed_salary, projected_variable_salary, projected_benefits')
          .eq('fiscal_year', fiscalYear)
          .eq('is_active', true)
          .in('projected_unit_id', unitIds.length > 0 ? unitIds : ['00000000-0000-0000-0000-000000000000']);
        
        totalApprovedBudget = projections?.reduce((sum, p) => 
          sum + (p.projected_fixed_salary || 0) + 
          (p.projected_variable_salary || 0) + 
          (p.projected_benefits || 0), 0) || 0;
      } else {
        // Caso contrário, somar apenas unidades específicas aprovadas
        for (const sub of approved) {
          if (sub.unit_id && unitIds.includes(sub.unit_id)) {
            const { data: projections } = await supabase
              .from('budget_employee_projections')
              .select('projected_fixed_salary, projected_variable_salary, projected_benefits')
              .eq('fiscal_year', fiscalYear)
              .eq('projected_unit_id', sub.unit_id)
              .eq('is_active', true);
            
            totalApprovedBudget += projections?.reduce((sum, p) => 
              sum + (p.projected_fixed_salary || 0) + 
              (p.projected_variable_salary || 0) + 
              (p.projected_benefits || 0), 0) || 0;
          }
        }
      }
      
      return {
        totalPending: pending,
        totalApproved: approved.length,
        totalApprovedBudget
      };
    },
    enabled: !!activeCompanyId,
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
      
      ws['!cols'] = [
        { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 18 },
      ];
      
      const fileName = `aprovacoes_orcamento_${fiscalYear}_${statusFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Exportação concluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Aprovações de Orçamento', 14, 15);
      
      doc.setFontSize(10);
      doc.text(`Ano Fiscal: ${fiscalYear}`, 14, 25);
      doc.text(`Status: ${statusFilter === 'all' ? 'Todos' : getStatusLabel(statusFilter)}`, 14, 30);
      if (unitFilter !== 'all') {
        const selectedUnit = units?.find(u => u.id === unitFilter);
        doc.text(`Unidade: ${selectedUnit?.description || ''}`, 14, 35);
      }
      
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
      toast.success('Exportação concluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
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
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Usar KPIs consolidados (independente do filtro de tabela)
  const totalPending = kpiData?.totalPending || 0;
  const totalApproved = kpiData?.totalApproved || 0;
  const totalBudget = kpiData?.totalApprovedBudget || 0;

  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto p-6">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Aprovações de Orçamento</h1>
            <p className="text-muted-foreground">
              Gerencie e aprove as submissões de orçamento das unidades
            </p>
          </div>
        </div>
        
        {userData?.isAdmin && (
          <Button variant="outline" onClick={() => setShowApproversConfig(true)}>
            <UserCog className="w-4 h-4 mr-2" />
            Configurar Aprovadores
          </Button>
        )}
      </div>

      {/* Alerta de Prazo Crítico */}
      {(deadlineData.isOverdue || deadlineData.isUrgent) && statsData.totalNotSubmitted > 0 && (
        <Alert className={`mb-4 ${deadlineData.isOverdue ? 'bg-red-50 dark:bg-red-950/30 border-red-300' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300'}`}>
          <AlertTriangle className={`h-4 w-4 ${deadlineData.isOverdue ? 'text-red-600' : 'text-amber-600'}`} />
          <AlertTitle className={deadlineData.isOverdue ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}>
            🚨 {deadlineData.isOverdue ? 'Prazo Vencido!' : 'Prazo Crítico!'}
          </AlertTitle>
          <AlertDescription className={deadlineData.isOverdue ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}>
            {deadlineData.isOverdue 
              ? `O prazo venceu há ${Math.abs(deadlineData.daysRemaining)} dias.`
              : `Faltam apenas ${deadlineData.daysRemaining} dias para o prazo.`}
            {' '}<strong>{statsData.totalNotSubmitted} unidades ainda não submeteram.</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Alertas de Pendentes */}
      {totalPending > 0 && (
        <Alert className="mb-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle>⚠️ Atenção!</AlertTitle>
          <AlertDescription>
            {totalPending} submissões aguardando revisão.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card Não Submetido */}
        <Card className={`cursor-pointer transition-all hover:shadow-md ${statsData.totalNotSubmitted > 0 ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20' : ''}`}
          onClick={() => setIsUnitsListOpen(!isUnitsListOpen)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Não Submetido</CardTitle>
            <div className="flex items-center gap-2">
              {deadlineData.isUrgent && statsData.totalNotSubmitted > 0 && (
                <Badge variant="destructive" className="text-xs animate-pulse">Urgente</Badge>
              )}
              <AlertTriangle className={`h-4 w-4 ${statsData.totalNotSubmitted > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statsData.totalNotSubmitted > 0 ? 'text-red-600' : ''}`}>
              {deadlineLoading ? <Skeleton className="h-8 w-12" /> : statsData.totalNotSubmitted}
            </div>
            <p className="text-xs text-muted-foreground">Unidades sem orçamento</p>
            {statsData.totalNotSubmitted > 0 && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <ChevronDown className="h-3 w-3" /> Clique para ver
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card Pendentes */}
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

        {/* Card Aprovados */}
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

        {/* Card Total Aprovado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Aprovado</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })
                .format(totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">Consolidado anual</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista Colapsável de Unidades Sem Submissão */}
      <Collapsible open={isUnitsListOpen} onOpenChange={setIsUnitsListOpen}>
        <CollapsibleContent>
          {statsData.totalNotSubmitted > 0 && (
            <Card className="mb-6 border-red-200 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/10 dark:to-orange-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Unidades Sem Submissão
                </CardTitle>
                <CardDescription>
                  {statsData.totalNotSubmitted} de {statsData.totalUnits} unidades ainda não submeteram o orçamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {statsData.unitsWithoutSubmission.map((unit) => (
                    <div key={unit.id} className="flex items-center justify-between p-2 bg-background rounded-md border">
                      <div>
                        <span className="font-medium">{unit.code}</span>
                        <span className="text-muted-foreground"> - {unit.description}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {unit.managerName ? (
                          <span>{unit.managerName}</span>
                        ) : (
                          <span className="text-amber-600">Sem gestor definido</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Seção de Data Limite */}
      <Card className="mb-6 border-purple-200 bg-gradient-to-br from-purple-50/50 to-violet-50/50 dark:from-purple-950/20 dark:to-violet-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Prazo de Submissão - Ano Fiscal {fiscalYear}</CardTitle>
            </div>
            {statsData.totalNotSubmitted > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => sendReminders()}
                disabled={isSendingReminders}
                className="border-purple-300 hover:bg-purple-100"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSendingReminders ? 'Enviando...' : 'Enviar Lembrete por Email'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            {/* Seletor de Data */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Prazo:</span>
              <Popover open={isDeadlineOpen} onOpenChange={setIsDeadlineOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`w-[180px] justify-start text-left font-normal ${!deadlineData.deadline ? 'text-muted-foreground' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadlineData.deadline 
                      ? format(deadlineData.deadline, 'dd/MM/yyyy', { locale: ptBR })
                      : 'Definir prazo'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadlineData.deadline || undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateDeadline(date);
                        setIsDeadlineOpen(false);
                      }
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Contador de Dias */}
            {deadlineData.deadline && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant={deadlineData.isOverdue ? 'destructive' : deadlineData.isUrgent ? 'default' : 'secondary'}
                  className={`text-sm px-3 py-1 ${deadlineData.isUrgent && !deadlineData.isOverdue ? 'bg-amber-500' : ''}`}
                >
                  {deadlineData.isOverdue 
                    ? `⚠️ Vencido há ${Math.abs(deadlineData.daysRemaining)} dias`
                    : deadlineData.daysRemaining === 0 
                      ? '🚨 Prazo é HOJE!'
                      : `📅 Faltam ${deadlineData.daysRemaining} dias`
                  }
                </Badge>
              </div>
            )}

            {/* Status de Lembretes */}
            {deadlineData.deadline && (
              <div className="text-sm text-muted-foreground">
                Lembretes automáticos: <span className="text-green-600 font-medium">✅ Ativo</span>
                <span className="text-xs ml-1">({deadlineData.reminderDaysBefore.join(', ')} dias antes)</span>
              </div>
            )}
          </div>

          {/* Último lembrete enviado */}
          {deadlineData.lastReminderSentAt && (
            <p className="text-xs text-muted-foreground mt-3">
              Último lembrete enviado: {format(deadlineData.lastReminderSentAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">Ano Fiscal</label>
              <Select value={fiscalYear.toString()} onValueChange={(v) => setFiscalYear(parseInt(v))}>
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
                      <SelectItem key={unit.id} value={unit.id} className={unit.hasSubmissions ? "font-semibold" : "text-muted-foreground"}>
                        <div className="flex items-center gap-2">
                          {unit.hasSubmissions && <CheckCircle className="h-4 w-4 text-green-600" />}
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
              <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!filteredSubmissions || filteredSubmissions.length === 0}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF} disabled={!filteredSubmissions || filteredSubmissions.length === 0}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSendReportDialog(true)} disabled={!filteredSubmissions || filteredSubmissions.length === 0}>
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
                      <Button size="sm" variant="outline" onClick={() => setSelectedSubmissionId(sub.id)}>
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

      {/* Modals */}
      {selectedSubmissionId && (
        <SubmissionReviewDialog
          submissionId={selectedSubmissionId}
          open={!!selectedSubmissionId}
          onOpenChange={(open) => !open && setSelectedSubmissionId(null)}
        />
      )}

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

      <ApproversConfigDialog
        open={showApproversConfig}
        onOpenChange={setShowApproversConfig}
      />
    </div>
  );
};

// Helper functions
function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'submitted': return 'default';
    case 'approved': return 'secondary';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft': return '📝 Rascunho';
    case 'submitted': return '⏳ Pendente';
    case 'approved': return '✅ Aprovado';
    case 'rejected': return '❌ Rejeitado';
    default: return status;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default BudgetApprovals;
