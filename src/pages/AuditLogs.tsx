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
import ExcelJS from 'exceljs';
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

  const exportToExcel = async () => {
    if (!logsData?.logs || !kpis) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      
      // Resumo sheet
      const summarySheet = workbook.addWorksheet('Resumo');
      summarySheet.addRow(['Métrica', 'Valor']);
      summarySheet.addRow(['Total de Consultas', kpis.total_queries]);
      summarySheet.addRow(['Total de Tokens', kpis.total_tokens]);
      summarySheet.addRow(['Tempo Médio (ms)', kpis.avg_response_time]);
      summarySheet.addRow(['Usuários Únicos', kpis.unique_users]);
      summarySheet.addRow(['Consultas Jurídicas', kpis.legal_queries]);
      summarySheet.addRow(['Consultas R&B', kpis.incentive_queries]);
      
      // Style header
      summarySheet.getRow(1).font = { bold: true };
      summarySheet.columns = [{ width: 25 }, { width: 20 }];

      // Detalhes sheet
      const detailsSheet = workbook.addWorksheet('Detalhes');
      detailsSheet.addRow(['Data/Hora', 'Usuário', 'Email', 'Empresa', 'Agente', 'Modo', 'Pergunta', 'Tokens', 'Tempo (ms)']);
      detailsSheet.getRow(1).font = { bold: true };
      
      logsData.logs.forEach(log => {
        detailsSheet.addRow([
          format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
          log.user_name,
          log.user_email,
          log.company_name,
          log.agent_type === 'legal' ? 'Jurídico' : 'R&B',
          log.operation_mode || 'N/A',
          log.question.substring(0, 100),
          log.tokens_used,
          log.response_time_ms
        ]);
      });
      
      detailsSheet.columns = [
        { width: 20 }, { width: 25 }, { width: 30 }, { width: 25 },
        { width: 12 }, { width: 15 }, { width: 50 }, { width: 10 }, { width: 12 }
      ];

      const fileName = `Auditoria_AgenteSmart_${format(new Date(), 'yyyyMMdd')}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Relatório Excel exportado com sucesso');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Erro ao exportar Excel');
    }
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
