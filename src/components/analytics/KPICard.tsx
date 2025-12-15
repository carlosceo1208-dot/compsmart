import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber, formatPercentage, formatCompactCurrency, formatCurrencyCustom } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | null | undefined;
  icon: LucideIcon;
  format?: 'currency' | 'number' | 'percentage' | 'compact-currency';
  isLoading?: boolean;
  className?: string;
  variant?: 'default' | 'success' | 'info' | 'premium' | 'warning';
  currency?: 'BRL' | 'USD';
}

export const KPICard = ({ title, value, icon: Icon, format = 'number', isLoading, className, variant = 'default', currency = 'BRL' }: KPICardProps) => {
  const formatValue = (val: number | null | undefined) => {
    switch (format) {
      case 'currency':
        return formatCurrencyCustom(val, currency);
      case 'compact-currency':
        return formatCompactCurrency(val, currency);
      case 'percentage':
        return formatPercentage(val);
      case 'number':
      default:
        return formatNumber(val);
    }
  };

  const variantStyles = {
    default: "bg-gradient-to-br from-background to-primary/5 border-2 border-primary/20 hover:border-primary/40 hover:shadow-primary",
    success: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700 hover:shadow-green-200/50 dark:hover:shadow-green-900/50",
    info: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-2 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-blue-200/50 dark:hover:shadow-blue-900/50",
    premium: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border-2 border-purple-200/50 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-purple-200/50 dark:hover:shadow-purple-900/50",
    warning: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 border-2 border-yellow-200/50 dark:border-yellow-800/50 hover:border-yellow-300 dark:hover:border-yellow-700 hover:shadow-yellow-200/50 dark:hover:shadow-yellow-900/50"
  };

  return (
    <Card className={cn("hover:-translate-y-1 transition-all duration-300", variantStyles[variant], className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2 font-medium">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {formatValue(value)}
              </p>
            )}
          </div>
          <div className="p-2 bg-primary/15 rounded-xl shadow-md flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
