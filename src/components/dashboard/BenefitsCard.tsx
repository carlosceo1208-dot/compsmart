import { Gift, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBenefitsKPI } from '@/hooks/useBenefitsKPI';
import { formatCompactCurrency, formatNumber } from '@/lib/formatters';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Currency } from '@/types/economic';

interface BenefitsCardProps {
  currency: Currency;
}

export const BenefitsCard = ({ currency }: BenefitsCardProps) => {
  const { data, isLoading } = useBenefitsKPI();
  const { convert } = useCurrencyConverter();

  const monthlyCost = data ? convert(data.monthlyCost, 'BRL', currency) : 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Gestão de Benefícios
          </CardTitle>
          <Link to="/benefits">
            <Button size="sm" variant="ghost" className="h-7 gap-1">
              <ExternalLink className="h-3 w-3" />
              <span className="text-xs">Gerenciar</span>
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatNumber(data?.totalBenefits)}</span>
              <span className="text-sm text-muted-foreground">benefícios</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Custo Mensal: <span className="font-semibold text-foreground">{formatCompactCurrency(monthlyCost)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
