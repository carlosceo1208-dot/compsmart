import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  className?: string;
}

export const ChartCard = ({ title, description, children, isLoading, isEmpty, className }: ChartCardProps) => {
  return (
    <Card className={`hover:shadow-md transition-all duration-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : isEmpty ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum dado disponível com os filtros aplicados</p>
          </div>
        ) : (
          <div className="w-full h-[300px]">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
