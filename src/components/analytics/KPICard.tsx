import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { formatNumber, formatPercentage, formatCompactCurrency, formatCurrencyCustom } from '@/lib/formatters';
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
  index?: number;
}

const variantStyles: Record<string, { bg: string; ring: string; iconBg: string; iconColor: string; glow: string }> = {
  default: {
    bg: 'bg-gradient-to-br from-card to-primary/5',
    ring: 'border-primary/20 hover:border-primary/40',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    glow: 'hover:shadow-primary',
  },
  success: {
    bg: 'bg-gradient-to-br from-card to-secondary/8',
    ring: 'border-secondary/25 hover:border-secondary/50',
    iconBg: 'bg-secondary/15',
    iconColor: 'text-secondary',
    glow: 'hover:shadow-success',
  },
  info: {
    bg: 'bg-gradient-to-br from-card to-accent/8',
    ring: 'border-accent/25 hover:border-accent/50',
    iconBg: 'bg-accent/15',
    iconColor: 'text-accent',
    glow: 'hover:shadow-accent',
  },
  premium: {
    bg: 'bg-gradient-to-br from-card via-primary/5 to-secondary/8',
    ring: 'border-primary/30 hover:border-primary/60',
    iconBg: 'bg-gradient-to-br from-primary/20 to-secondary/20',
    iconColor: 'text-primary',
    glow: 'hover:shadow-glow-primary',
  },
  warning: {
    bg: 'bg-gradient-to-br from-card to-warning/8',
    ring: 'border-warning/25 hover:border-warning/50',
    iconBg: 'bg-warning/15',
    iconColor: 'text-warning',
    glow: 'hover:shadow-warning',
  },
};

export const KPICard = ({
  title,
  value,
  icon: Icon,
  format = 'number',
  isLoading,
  className,
  variant = 'default',
  currency = 'BRL',
  index = 0,
}: KPICardProps) => {
  const formatter = (val: number) => {
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

  const styles = variantStyles[variant];
  const numericValue = typeof value === 'number' ? value : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <Card
        className={cn(
          'border transition-all duration-300 overflow-hidden relative',
          styles.bg,
          styles.ring,
          styles.glow,
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />
        <CardContent className="p-4 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-2 font-medium truncate">{title}</p>
              {isLoading || value === null || value === undefined ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  <AnimatedCounter value={numericValue} formatter={formatter} />
                </p>
              )}
            </div>
            <div className={cn('p-2.5 rounded-xl shadow-sm flex items-center justify-center transition-transform duration-300 hover:scale-110', styles.iconBg)}>
              <Icon className={cn('h-5 w-5', styles.iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
