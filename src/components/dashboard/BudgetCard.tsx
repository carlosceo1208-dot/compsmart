import { useState } from 'react';
import { PiggyBank, ExternalLink, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Download, History, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBudgetPlanningAnnualKPI } from '@/hooks/useBudgetPlanningAnnualKPI';
import { useBudgetVarianceAlert, useBudgetThreshold } from '@/hooks/useBudgetVarianceAlert';
import { formatCurrency, formatNumber, formatPercentageSafe } from '@/lib/formatters';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Currency } from '@/types/economic';
import { Link } from 'react-router-dom';
import { BudgetMultiYearChart } from '@/components/budget/BudgetMultiYearChart';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BudgetCardProps {
  currency: Currency;
  unitId?: string | null;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const BudgetCard = ({ currency }: BudgetCardProps) => {
  const { data, isLoading } = useBudgetPlanningAnnualKPI();
  const { convert } = useCurrencyConverter();
  const { data: varianceAlert } = useBudgetVarianceAlert();
  const { data: budgetThreshold } = useBudgetThreshold();
  const [historyOpen, setHistoryOpen] = useState(false);

  // Priorizar exibição do ano atual aprovado
  const isApproved = data?.hasCurrentYearApproved || data?.submissionStatus === 'approved';
  const displayYear = data?.hasCurrentYearApproved ? data?.currentYear : data?.projectedYear;

  // Valores separados convertidos para moeda selecionada
  const currentFixed = data ? convert(data.currentFixedSalary, 'BRL', currency) : 0;
  const currentVariable = data ? convert(data.currentVariableSalary, 'BRL', currency) : 0;
  const currentBenefits = data ? convert(data.currentBenefits, 'BRL', currency) : 0;
  const currentTotal = data ? convert(data.currentTotal, 'BRL', currency) : 0;
  
  const projectedFixed = data ? convert(data.projectedFixedSalary, 'BRL', currency) : 0;
  const projectedVariable = data ? convert(data.projectedVariableSalary, 'BRL', currency) : 0;
  const projectedBenefits = data ? convert(data.projectedBenefits, 'BRL', currency) : 0;
  const projectedTotal = data ? convert(data.projectedTotal, 'BRL', currency) : 0;

  const adjustmentCost = data?.approvedAdjustment ? convert(data.approvedAdjustment.annualCost, 'BRL', currency) : 0;

  // Usar variações calculadas pelo hook em base comparável (ano vs ano)
  const fixedVariance = data?.fixedVariancePercent || 0;
  const variableVariance = data?.variableVariancePercent || 0;
  const benefitsVariance = data?.benefitsVariancePercent || 0;
  const totalVariance = data?.salaryVariancePercent || 0;

  const getStatusBadge = () => {
    if (!data?.submissionStatus) return null;
    
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'outline' as const, className: '' },
      pending: { label: 'Aguardando Aprovação', variant: 'default' as const, className: '' },
      approved: { label: '✓ Aprovado', variant: 'default' as const, className: 'bg-green-600 text-white hover:bg-green-700' },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const, className: '' },
    };

    const config = statusConfig[data.submissionStatus as keyof typeof statusConfig];
    if (!config) return null;
    
    return (
      <Badge variant={config.variant} className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const renderVariance = (variance: number, showIcon = false) => {
    const isPositive = variance > 0;
    const isNegative = variance < 0;
    const colorClass = isPositive 
      ? 'text-green-600 dark:text-green-400' 
      : isNegative 
        ? 'text-red-600 dark:text-red-400' 
        : 'text-muted-foreground';
    
    return (
      <div className="flex items-center justify-center gap-0.5">
        {showIcon && isPositive && <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />}
        {showIcon && isNegative && <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />}
        <span className={colorClass}>
          {formatPercentageSafe(variance, 1, true)}
        </span>
      </div>
    );
  };

  const handleExportPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    if (isApproved) {
      doc.setTextColor(34, 139, 34); // Verde
      doc.text(`✓ Orçamento Aprovado ${data.projectedYear}`, 20, 20);
    } else {
      doc.setTextColor(0, 0, 0);
      doc.text(`Planejamento Orçamentário ${data.projectedYear}`, 20, 20);
    }
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Comparativo ${data.currentYear} vs ${data.projectedYear}`, 20, 30);

    // Tabela comparativa
    autoTable(doc, {
      startY: 40,
      head: [['Categoria', `${data.currentYear}`, `${data.projectedYear}`, 'Variação']],
      body: [
        ['Headcount', formatNumber(data.currentHeadcount), formatNumber(data.projectedHeadcount), formatPercentageSafe(data.headcountVariancePercent, 1, true)],
        ['Salário Fixo', formatCurrency(currentFixed), formatCurrency(projectedFixed), formatPercentageSafe(fixedVariance, 1, true)],
        ['Variável', formatCurrency(currentVariable), formatCurrency(projectedVariable), formatPercentageSafe(variableVariance, 1, true)],
        ['Benefícios', formatCurrency(currentBenefits), formatCurrency(projectedBenefits), formatPercentageSafe(benefitsVariance, 1, true)],
        ['TOTAL', formatCurrency(currentTotal), formatCurrency(projectedTotal), formatPercentageSafe(totalVariance, 1, true)],
      ],
      theme: 'striped',
      headStyles: { fillColor: isApproved ? [34, 139, 34] : [59, 130, 246] },
    });

    // Ajuste coletivo se houver
    if (data.approvedAdjustment) {
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      doc.setFontSize(10);
      doc.setTextColor(180, 120, 0);
      doc.text(`Ajuste Coletivo Aprovado: "${data.approvedAdjustment.name}" (${data.approvedAdjustment.percentage}%)`, 20, finalY + 15);
      doc.text(`Impacto Anual: +${formatCurrency(adjustmentCost)} (${data.approvedAdjustment.employeesAffected} funcionários)`, 20, finalY + 22);
    }
    
    // Rodapé
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 280);
    doc.text('CompSmart - Sistema de Gestão de Remuneração', 20, 286);
    
    doc.save(`orcamento-${isApproved ? 'aprovado' : 'planejamento'}-${data.projectedYear}.pdf`);
    toast.success('PDF exportado com sucesso!');
  };

  // Card styles based on approval status
  const cardClasses = isApproved
    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700'
    : 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2 border-yellow-200/50 dark:border-yellow-800/50 hover:border-yellow-300 dark:hover:border-yellow-700';

  return (
    <Card className={`${cardClasses} hover:shadow-lg transition-all duration-200`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isApproved ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-700 dark:text-green-400">
                Orçamento Aprovado {displayYear}
              </span>
            </>
          ) : (
            <>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Planejamento Orçamentário {data?.projectedYear || new Date().getFullYear() + 1}
              </span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !data?.hasPlanning && !data?.hasCurrentYearApproved ? (
          // Estado: Sem planejamento e sem ano atual aprovado
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Dados Atuais (Baseline)</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Headcount:</span>
                <span className="font-semibold text-sm">{formatNumber(data?.currentHeadcount || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Custo Anual:</span>
                <span className="font-semibold text-sm">{formatCurrency(currentTotal)}</span>
              </div>
            </div>

            <Badge variant="outline" className="w-full justify-center text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
              ⚠️ Nenhum planejamento iniciado para {data?.projectedYear}
            </Badge>
            
            <Button asChild className="w-full" size="sm">
              <Link to="/budget-planning">
                📝 Iniciar Planejamento {data?.projectedYear}
              </Link>
            </Button>
          </div>
        ) : (
          // Estado: Com planejamento - Comparação Detalhada
          <div className="space-y-3">
            {/* Alerta de Variação Acima do Limite */}
            {varianceAlert?.exceedsThreshold && (
              <Alert className="bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <AlertTitle className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 ml-1">
                  ⚠️ Variação Acima do Limite
                </AlertTitle>
                <AlertDescription className="text-[10px] text-amber-700 dark:text-amber-300 ml-1">
                  Orçamento {formatPercentageSafe(totalVariance, 1, true)} acima do ano anterior. Limite: {budgetThreshold || 10}%
                </AlertDescription>
              </Alert>
            )}

            {/* Tabela de Comparação */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-[10px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-1.5 font-medium"></th>
                    <th className="text-center p-1.5 font-medium">{data.currentYear}</th>
                    <th className={`text-center p-1.5 font-medium ${isApproved ? 'text-green-700 dark:text-green-400' : ''}`}>
                      {isApproved ? `✓ ${data.projectedYear}` : data.projectedYear}
                    </th>
                    <th className="text-center p-1.5 font-medium">Var.</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Headcount */}
                  <tr className="border-t">
                    <td className="p-1.5 font-medium">Headcount</td>
                    <td className="text-center p-1.5">{formatNumber(data.currentHeadcount)}</td>
                    <td className={`text-center p-1.5 font-semibold ${isApproved ? 'text-green-700 dark:text-green-400' : ''}`}>
                      {formatNumber(data.projectedHeadcount)}
                    </td>
                    <td className="text-center p-1.5">
                      {renderVariance(data.headcountVariancePercent)}
                    </td>
                  </tr>
                  {/* Salário Fixo */}
                  <tr className="border-t bg-muted/20">
                    <td className="p-1.5 font-medium">Fixo</td>
                    <td className="text-center p-1.5">{formatCurrency(currentFixed)}</td>
                    <td className={`text-center p-1.5 font-semibold ${isApproved ? 'text-green-700 dark:text-green-400' : ''}`}>
                      {formatCurrency(projectedFixed)}
                    </td>
                    <td className="text-center p-1.5">
                      {renderVariance(fixedVariance, true)}
                    </td>
                  </tr>
                  {/* Variável */}
                  <tr className="border-t">
                    <td className="p-1.5 font-medium">Variável</td>
                    <td className="text-center p-1.5">{formatCurrency(currentVariable)}</td>
                    <td className={`text-center p-1.5 font-semibold ${isApproved ? 'text-green-700 dark:text-green-400' : ''}`}>
                      {formatCurrency(projectedVariable)}
                    </td>
                    <td className="text-center p-1.5">
                      {renderVariance(variableVariance, true)}
                    </td>
                  </tr>
                  {/* Benefícios */}
                  <tr className="border-t bg-muted/20">
                    <td className="p-1.5 font-medium">Benefícios</td>
                    <td className="text-center p-1.5">{formatCurrency(currentBenefits)}</td>
                    <td className={`text-center p-1.5 font-semibold ${isApproved ? 'text-green-700 dark:text-green-400' : ''}`}>
                      {formatCurrency(projectedBenefits)}
                    </td>
                    <td className="text-center p-1.5">
                      {renderVariance(benefitsVariance, true)}
                    </td>
                  </tr>
                  {/* TOTAL */}
                  <tr className={`border-t font-bold ${isApproved ? 'bg-green-100/50 dark:bg-green-900/20' : 'bg-primary/10'}`}>
                    <td className="p-1.5">TOTAL</td>
                    <td className="text-center p-1.5">{formatCurrency(currentTotal)}</td>
                    <td className={`text-center p-1.5 ${isApproved ? 'text-green-700 dark:text-green-400' : ''}`}>
                      {formatCurrency(projectedTotal)}
                    </td>
                    <td className="text-center p-1.5">
                      {renderVariance(totalVariance, true)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Alerta de Ajuste Coletivo Aprovado */}
            {data.approvedAdjustment && (
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <AlertTitle className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 ml-1">
                  Ajuste Coletivo Aprovado
                </AlertTitle>
                <AlertDescription className="text-[10px] text-amber-700 dark:text-amber-300 ml-1 space-y-0.5">
                  <div className="font-medium">"{data.approvedAdjustment.name}" ({data.approvedAdjustment.percentage}%)</div>
                  <div>Vigência: {MONTHS[data.approvedAdjustment.effectiveMonth - 1]}/{data.projectedYear}</div>
                  <div className="font-semibold">
                    Impacto: +{formatCurrency(adjustmentCost)} ({data.approvedAdjustment.employeesAffected} func.)
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Status da Submissão */}
            {data.submissionStatus && (
              <div className="flex justify-center">
                {getStatusBadge()}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-1 border-t">
              <Button asChild variant="outline" size="sm" className="flex-1 text-[10px] h-7">
                <Link to="/budget-planning" className="inline-flex items-center gap-1">
                  Planejamento <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 text-[10px] h-7">
                <Link to="/budget-approvals" className="inline-flex items-center gap-1">
                  Aprovações <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
              <Button 
                onClick={handleExportPDF} 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] px-2"
                title="Exportar PDF"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>

            {/* Histórico de Orçamentos Multi-Ano */}
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className="border-t pt-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                <span className="flex items-center gap-1">
                  <History className="h-3 w-3" />
                  Histórico de Orçamentos
                </span>
                <ChevronDown className={`h-3 w-3 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <BudgetMultiYearChart compact />
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
