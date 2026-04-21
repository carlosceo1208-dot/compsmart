import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  className?: string;
  index?: number;
}

export const ChartCard = ({ title, description, children, isLoading, isEmpty, className, index = 0 }: ChartCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn('card-elevated border-border/60 transition-all duration-300 hover:shadow-lg overflow-hidden', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton variant="shimmer" className="h-[300px] w-full rounded-lg" />
            </div>
          ) : isEmpty ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Nenhum dado disponível com os filtros aplicados</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-full h-[300px]"
            >
              {children}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
