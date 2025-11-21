import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, DollarSign, Award } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/formatters';
import { UnitBenefitsHistory } from '@/hooks/useBenefitsHistoryByUnit';

interface ComparisonKPICardsProps {
  unitsData: UnitBenefitsHistory[];
}

export const ComparisonKPICards = ({ unitsData }: ComparisonKPICardsProps) => {
  if (unitsData.length === 0) return null;

  // Unidade com maior custo
  const highestCostUnit = [...unitsData].sort(
    (a, b) => b.summary.avgMonthlyCost - a.summary.avgMonthlyCost
  )[0];

  // Unidade com maior crescimento
  const highestGrowthUnit = [...unitsData].sort(
    (a, b) => b.summary.trendPercentage - a.summary.trendPercentage
  )[0];

  // Total de funcionários com benefícios
  const totalEmployees = unitsData.reduce((sum, unit) => {
    const lastMonth = unit.history[unit.history.length - 1];
    return sum + (lastMonth?.employeesCount || 0);
  }, 0);

  // Custo médio por funcionário
  const avgCostPerEmployee = unitsData.reduce((sum, unit) => {
    const lastMonth = unit.history[unit.history.length - 1];
    return sum + (lastMonth?.avgCostPerEmployee || 0);
  }, 0) / unitsData.length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Maior Custo */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Maior Custo
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{formatCurrency(highestCostUnit.summary.avgMonthlyCost)}</p>
          <p className="text-sm text-muted-foreground">{highestCostUnit.unitName}</p>
        </div>
      </Card>

      {/* Maior Crescimento */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              highestGrowthUnit.summary.trendPercentage >= 0 
                ? 'bg-green-500/10' 
                : 'bg-red-500/10'
            }`}>
              {highestGrowthUnit.summary.trendPercentage >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Maior Crescimento
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">
            {highestGrowthUnit.summary.trendPercentage >= 0 ? '+' : ''}
            {formatPercentage(highestGrowthUnit.summary.trendPercentage)}
          </p>
          <p className="text-sm text-muted-foreground">{highestGrowthUnit.unitName}</p>
        </div>
      </Card>

      {/* Total de Funcionários */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Total Funcionários
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{formatNumber(totalEmployees)}</p>
          <p className="text-sm text-muted-foreground">com benefícios ativos</p>
        </div>
      </Card>

      {/* Custo Médio por Funcionário */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Custo/Funcionário
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{formatCurrency(avgCostPerEmployee)}</p>
          <p className="text-sm text-muted-foreground">média entre unidades</p>
        </div>
      </Card>
    </div>
  );
};
