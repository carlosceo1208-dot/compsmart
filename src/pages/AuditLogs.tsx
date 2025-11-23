import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, Shield } from 'lucide-react';
import { AuditKPICards } from '@/components/audit/AuditKPICards';
import { AuditFilterPanel } from '@/components/audit/AuditFilterPanel';
import { AuditChartsSection } from '@/components/audit/AuditChartsSection';
import { AuditLogsTable } from '@/components/audit/AuditLogsTable';
import { useAuditLogs, AuditFilters } from '@/hooks/useAuditLogs';
import { useAuditKPIs } from '@/hooks/useAuditKPIs';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { subDays, format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const AuditLogs = () => {
  const { data: userRole, isLoading: loadingRole } = useCurrentUserRole();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditFilters>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    companyId: undefined,
    userId: undefined,
    agentType: null,
    operationMode: undefined
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data: logsData, isLoading: loadingLogs } = useAuditLogs(appliedFilters, page);
  const { data: kpis, isLoading: loadingKPIs } = useAuditKPIs(appliedFilters);

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const exportToExcel = () => {
    if (!logsData?.logs || !kpis) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const kpiData = [
      ['Métrica', 'Valor'],
      ['Total de Consultas', kpis.total_queries],
      ['Total de Tokens', kpis.total_tokens],
      ['Tempo Médio (ms)', kpis.avg_response_time],
      ['Usuários Únicos', kpis.unique_users],
      ['Consultas Jurídicas', kpis.legal_queries],
      ['Consultas R&B', kpis.incentive_queries]
    ];

    const logsDataFormatted = logsData.logs.map(log => ({
      'Data/Hora': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
      'Usuário': log.user_name,
      'Email': log.user_email,
      'Empresa': log.company_name,
      'Agente': log.agent_type === 'legal' ? 'Jurídico' : 'R&B',
      'Modo': log.operation_mode || 'N/A',
      'Pergunta': log.question.substring(0, 100),
      'Tokens': log.tokens_used,
      'Tempo (ms)': log.response_time_ms
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(kpiData);
    const ws2 = XLSX.utils.json_to_sheet(logsDataFormatted);

    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');
    XLSX.utils.book_append_sheet(wb, ws2, 'Detalhes');

    const fileName = `Auditoria_AgenteSmart_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('Relatório Excel exportado com sucesso');
  };

  const exportToPDF = () => {
    if (!logsData?.logs || !kpis) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Relatório de Auditoria - Agentes Smart', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Período: ${format(appliedFilters.startDate, 'dd/MM/yyyy')} a ${format(appliedFilters.endDate, 'dd/MM/yyyy')}`, 14, 30);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);

    doc.setFontSize(14);
    doc.text('Resumo Executivo', 14, 46);
    
    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Consultas', kpis.total_queries.toString()],
        ['Tokens Consumidos', kpis.total_tokens.toString()],
        ['Tempo Médio', `${kpis.avg_response_time}ms`],
        ['Usuários Únicos', kpis.unique_users.toString()],
        ['Consultas Jurídicas', kpis.legal_queries.toString()],
        ['Consultas R&B', kpis.incentive_queries.toString()]
      ]
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.text('Detalhamento das Consultas', 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Data', 'Usuário', 'Agente', 'Modo', 'Tokens', 'Tempo']],
      body: logsData.logs.slice(0, 50).map(log => [
        format(new Date(log.created_at), 'dd/MM HH:mm'),
        log.user_name.substring(0, 20),
        log.agent_type === 'legal' ? 'Jurídico' : 'R&B',
        log.operation_mode?.substring(0, 15) || 'N/A',
        log.tokens_used.toString(),
        `${log.response_time_ms}ms`
      ]),
      styles: { fontSize: 8 }
    });

    doc.save(`Auditoria_AgenteSmart_${format(new Date(), 'yyyyMMdd')}.pdf`);
    
    toast.success('Relatório PDF exportado com sucesso');
  };

  if (loadingRole) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!userRole?.isAdmin && !userRole?.isHR) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Apenas Administradores e RH podem acessar os logs de auditoria.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auditoria de Acesso</h1>
          <p className="text-muted-foreground mt-1">
            Logs e relatórios de uso dos Agentes Smart
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <AuditKPICards kpis={kpis} isLoading={loadingKPIs} />

      {/* Filtros e Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div>
          <AuditFilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onApply={applyFilters}
          />
        </div>
        <div className="lg:col-span-3">
          <AuditChartsSection filters={appliedFilters} />
        </div>
      </div>

      {/* Tabela de Logs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Logs Detalhados</h2>
        <AuditLogsTable
          logs={logsData?.logs}
          isLoading={loadingLogs}
          page={page}
          totalPages={logsData?.totalPages || 1}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default AuditLogs;
