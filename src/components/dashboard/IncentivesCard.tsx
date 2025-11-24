import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIncentivesKPI } from '@/hooks/useIncentivesKPI';
import { formatCompactCurrency } from '@/lib/formatters';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Currency } from '@/types/economic';
import { useNavigate } from 'react-router-dom';

interface IncentivesCardProps {
  currency: Currency;
}

export const IncentivesCard = ({ currency }: IncentivesCardProps) => {
  const { data, isLoading } = useIncentivesKPI();
  const { convert } = useCurrencyConverter();
  const navigate = useNavigate();

  const shortTerm = data ? convert(data.shortTerm, 'BRL', currency) : 0;
  const longTerm = data ? convert(data.longTerm, 'BRL', currency) : 0;

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer" 
      onClick={() => navigate('/incentive-programs?tab=kpis')}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" />
          Programa de Incentivos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ICP (Curto):</span>
              <span className="font-semibold">{formatCompactCurrency(shortTerm)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ILP (Longo):</span>
              <span className="font-semibold">{formatCompactCurrency(longTerm)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
