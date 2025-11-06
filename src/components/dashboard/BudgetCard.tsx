import { PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useBudgetKPI } from '@/hooks/useBudgetKPI';
import { formatCompactCurrency, formatNumber } from '@/lib/formatters';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Currency } from '@/types/economic';

interface BudgetCardProps {
  currency: Currency;
  unitId?: string | null;
}

export const BudgetCard = ({ currency, unitId }: BudgetCardProps) => {
  const { data, isLoading } = useBudgetKPI({ unitId });
  const { convert } = useCurrencyConverter();

  const realSalary = data ? convert(data.realSalary, 'BRL', currency) : 0;
  const budgetedSalary = data ? convert(data.budgetedSalary, 'BRL', currency) : 0;
  const salaryVariance = data ? convert(data.salaryVariance, 'BRL', currency) : 0;

  const isOverBudget = salaryVariance > 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <PiggyBank className="h-4 w-4" />
          Orçamento vs. Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !data || data.budgetedSalary === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              📊 Nenhum orçamento cadastrado
            </p>
            <a href="/budget" className="text-sm text-primary hover:underline">
              Cadastre o orçamento mensal
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Salários:</span>
              <div className="text-right">
                <div className="font-semibold text-sm">{formatCompactCurrency(realSalary)}</div>
                <div className="text-xs text-muted-foreground">
                  Budget: {formatCompactCurrency(budgetedSalary)}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Headcount:</span>
              <div className="text-right">
                <div className="font-semibold text-sm">{formatNumber(data?.realHeadcount)}</div>
                <div className="text-xs text-muted-foreground">
                  Budget: {formatNumber(data?.budgetedHeadcount)}
                </div>
              </div>
            </div>

            {data?.budgetedSalary > 0 && (
              <Badge variant={isOverBudget ? "destructive" : "success"} className="w-full justify-center">
                {isOverBudget ? '⚠️ Acima' : '✅ Dentro'} do Orçamento
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
