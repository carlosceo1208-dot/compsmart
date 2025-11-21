import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { UnitBenefitsHistory } from '@/hooks/useBenefitsHistoryByUnit';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface TrendAnalysisSectionProps {
  unitsData: UnitBenefitsHistory[];
}

interface Insight {
  type: 'warning' | 'alert' | 'success';
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const TrendAnalysisSection = ({ unitsData }: TrendAnalysisSectionProps) => {
  if (unitsData.length === 0) return null;

  const insights: Insight[] = [];

  // Calcular média geral de custo por funcionário
  const avgCostPerEmployee = unitsData.reduce((sum, unit) => {
    const lastMonth = unit.history[unit.history.length - 1];
    return sum + (lastMonth?.avgCostPerEmployee || 0);
  }, 0) / unitsData.length;

  // Análise 1: Unidades com crescimento alto
  unitsData.forEach((unit) => {
    if (unit.summary.trendPercentage > 15) {
      insights.push({
        type: 'alert',
        icon: <AlertCircle className="h-5 w-5" />,
        title: `${unit.unitName} - Crescimento Acentuado`,
        description: `Aumento de ${formatPercentage(unit.summary.trendPercentage)} no custo de benefícios. Requer atenção.`,
      });
    }
  });

  // Análise 2: Unidades muito abaixo da média
  unitsData.forEach((unit) => {
    const lastMonth = unit.history[unit.history.length - 1];
    const unitAvgCost = lastMonth?.avgCostPerEmployee || 0;
    if (unitAvgCost < avgCostPerEmployee * 0.8) {
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="h-5 w-5" />,
        title: `${unit.unitName} - Abaixo da Média`,
        description: `Custo/funcionário ${formatPercentage(((avgCostPerEmployee - unitAvgCost) / avgCostPerEmployee) * 100)} abaixo da média geral (${formatCurrency(unitAvgCost)} vs ${formatCurrency(avgCostPerEmployee)}).`,
      });
    }
  });

  // Análise 3: Unidades com boa co-participação
  unitsData.forEach((unit) => {
    const lastMonth = unit.history[unit.history.length - 1];
    const empPercentage = lastMonth?.employeeCostPercentage || 0;
    if (empPercentage >= 25 && empPercentage <= 35) {
      insights.push({
        type: 'success',
        icon: <CheckCircle className="h-5 w-5" />,
        title: `${unit.unitName} - Co-participação Ideal`,
        description: `Mantém co-participação equilibrada de ${formatPercentage(empPercentage)} (funcionários) - dentro da faixa recomendada.`,
      });
    }
  });

  // Análise 4: Unidades sem co-participação
  unitsData.forEach((unit) => {
    const lastMonth = unit.history[unit.history.length - 1];
    const empPercentage = lastMonth?.employeeCostPercentage || 0;
    if (empPercentage === 0) {
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="h-5 w-5" />,
        title: `${unit.unitName} - Sem Co-participação`,
        description: `Empresa arca com 100% dos custos de benefícios. Considere revisar política para promover valorização.`,
      });
    }
  });

  // Análise 5: Crescimento sustentável
  unitsData.forEach((unit) => {
    if (unit.summary.trendPercentage > 0 && unit.summary.trendPercentage <= 10) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="h-5 w-5" />,
        title: `${unit.unitName} - Crescimento Sustentável`,
        description: `Crescimento moderado de ${formatPercentage(unit.summary.trendPercentage)}, indicando expansão controlada.`,
      });
    }
  });

  if (insights.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Análise de Tendências</h3>
        <p className="text-muted-foreground">
          Nenhuma tendência significativa detectada no período analisado.
        </p>
      </Card>
    );
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'text-red-600 bg-red-50 dark:bg-red-950/30';
      case 'warning':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
      case 'success':
        return 'text-green-600 bg-green-50 dark:bg-green-950/30';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Análise de Tendências e Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg flex items-start gap-3 ${getInsightColor(insight.type)}`}
          >
            <div className="mt-0.5">{insight.icon}</div>
            <div className="flex-1 space-y-1">
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              <p className="text-sm opacity-90">{insight.description}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {insight.type === 'alert' && 'Crítico'}
              {insight.type === 'warning' && 'Atenção'}
              {insight.type === 'success' && 'Positivo'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
