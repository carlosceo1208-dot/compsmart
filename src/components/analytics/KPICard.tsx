import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber, formatPercentage, formatCompactCurrency } from '@/lib/formatters';

interface KPICardProps {
  title: string;
  value: number | null | undefined;
  icon: LucideIcon;
  format?: 'currency' | 'number' | 'percentage' | 'compact-currency';
  isLoading?: boolean;
  className?: string;
}

export const KPICard = ({ title, value, icon: Icon, format = 'number', isLoading, className }: KPICardProps) => {
  const formatValue = (val: number | null | undefined) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'compact-currency':
        return formatCompactCurrency(val);
      case 'percentage':
        return formatPercentage(val);
      case 'number':
      default:
        return formatNumber(val);
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-background to-primary/5 border-2 border-primary/20 hover:border-primary/40 hover:shadow-primary hover:-translate-y-1 transition-all duration-300 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2 font-medium">{title}</p>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {formatValue(value)}
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/15 rounded-xl shadow-md flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
