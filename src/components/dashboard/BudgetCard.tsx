import { PiggyBank, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBudgetPlanningAnnualKPI } from '@/hooks/useBudgetPlanningAnnualKPI';
import { formatCompactCurrency, formatNumber, formatPercentageSafe } from '@/lib/formatters';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Currency } from '@/types/economic';
import { Link } from 'react-router-dom';

interface BudgetCardProps {
  currency: Currency;
  unitId?: string | null;
}

export const BudgetCard = ({ currency }: BudgetCardProps) => {
  const { data, isLoading } = useBudgetPlanningAnnualKPI();
  const { convert } = useCurrencyConverter();

  const currentAnnual = data ? convert(data.currentAnnualSalary, 'BRL', currency) : 0;
  const projectedAnnual = data ? convert(data.projectedAnnualSalary, 'BRL', currency) : 0;
  const variance = data ? convert(data.salaryVariance, 'BRL', currency) : 0;

  const getStatusBadge = () => {
    if (!data?.submissionStatus) return null;
    
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'outline' as const },
      pending: { label: 'Aguardando Aprovação', variant: 'default' as const },
      approved: { label: 'Aprovado', variant: 'success' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const },
    };

    const config = statusConfig[data.submissionStatus as keyof typeof statusConfig];
    if (!config) return null; // Safety check: status não mapeado
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2 border-yellow-200/50 dark:border-yellow-800/50 hover:border-yellow-300 dark:hover:border-yellow-700 hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <PiggyBank className="h-4 w-4" />
          Planejamento Orçamentário {data?.projectedYear || new Date().getFullYear() + 1}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !data?.hasPlanning ? (
          // Estado: Sem planejamento
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Dados Atuais (Baseline)</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Headcount:</span>
                <span className="font-semibold text-sm">{formatNumber(data?.currentHeadcount || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Custo Anual:</span>
                <span className="font-semibold text-sm">{formatCompactCurrency(currentAnnual, currency)}</span>
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
          // Estado: Com planejamento - Comparação
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Comparação Ano-a-Ano</p>
              
              {/* Tabela de Comparação */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium"></th>
                      <th className="text-center p-2 font-medium">{data.currentYear}</th>
                      <th className="text-center p-2 font-medium">{data.projectedYear}</th>
                      <th className="text-center p-2 font-medium">Var.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-2 font-medium">Headcount</td>
                      <td className="text-center p-2">{formatNumber(data.currentHeadcount)}</td>
                      <td className="text-center p-2 font-semibold">{formatNumber(data.projectedHeadcount)}</td>
                      <td className="text-center p-2">
                        <span className={data.headcountVariance > 0 ? 'text-green-600 dark:text-green-400' : data.headcountVariance < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                          {data.headcountVariance > 0 && '+'}
                          {formatPercentageSafe(data.headcountVariancePercent, 0, true)}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-t bg-muted/30">
                      <td className="p-2 font-medium">Salários</td>
                      <td className="text-center p-2 text-[10px]">{formatCompactCurrency(currentAnnual, currency)}</td>
                      <td className="text-center p-2 font-semibold text-[10px]">{formatCompactCurrency(projectedAnnual, currency)}</td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-1">
                          {data.salaryVariance > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : data.salaryVariance < 0 ? (
                            <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                          ) : null}
                          <span className={data.salaryVariance > 0 ? 'text-green-600 dark:text-green-400' : data.salaryVariance < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                            {formatPercentageSafe(data.salaryVariancePercent, 0, true)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status da Submissão */}
            {data.submissionStatus && (
              <div className="flex justify-center">
                {getStatusBadge()}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-2 border-t">
              <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                <Link to="/budget-planning" className="inline-flex items-center gap-1">
                  Ver Planejamento <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                <Link to="/budget-approvals" className="inline-flex items-center gap-1">
                  Aprovações <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
