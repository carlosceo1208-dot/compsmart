import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIncentivesKPI } from '@/hooks/useIncentivesKPI';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { formatCompactCurrency } from '@/lib/formatters';
import { Currency } from '@/types/economic';
import { Target, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface IncentivesKPIDashboardProps {
  currency: Currency;
}

export const IncentivesKPIDashboard = ({ currency }: IncentivesKPIDashboardProps) => {
  const { data, isLoading } = useIncentivesKPI();
  const { convert } = useCurrencyConverter();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const shortTerm = data ? convert(data.shortTerm, 'BRL', currency) : 0;
  const longTerm = data ? convert(data.longTerm, 'BRL', currency) : 0;
  const total = shortTerm + longTerm;
  const icpPercentage = total > 0 ? (shortTerm / total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              ICP - Curto Prazo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCompactCurrency(shortTerm)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {icpPercentage.toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              ILP - Longo Prazo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCompactCurrency(longTerm)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(100 - icpPercentage).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Provisão Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCompactCurrency(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ICP + ILP
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Programas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.activePrograms || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Em vigência
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral de Incentivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">ICP (Curto Prazo)</span>
                <span className="text-sm text-muted-foreground">
                  {formatCompactCurrency(shortTerm)}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${icpPercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">ILP (Longo Prazo)</span>
                <span className="text-sm text-muted-foreground">
                  {formatCompactCurrency(longTerm)}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${100 - icpPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Composição dos Incentivos</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">ICP representa:</p>
                <p className="font-semibold">{icpPercentage.toFixed(1)}% do total</p>
              </div>
              <div>
                <p className="text-muted-foreground">ILP representa:</p>
                <p className="font-semibold">{(100 - icpPercentage).toFixed(1)}% do total</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
