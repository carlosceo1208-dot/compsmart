import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { Users, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { getSalaryStatusBadge } from '@/lib/salaryCalculations';

interface Employee {
  full_name: string;
  salary: number;
  salary_range_percentage: number | null;
  grade: string | null;
  job_title: string | null;
}

interface AllSalariesListCardProps {
  employees: Employee[] | undefined;
  isLoading?: boolean;
}

export const AllSalariesListCard = ({ employees, isLoading }: AllSalariesListCardProps) => {
  const maxSalary = employees && employees.length > 0 
    ? Math.max(...employees.map(e => e.salary)) 
    : 0;

  const getPositionIcon = (percentage: number | null) => {
    if (percentage === null) return null;
    if (percentage < 0) return <TrendingDown className="h-3 w-3" />;
    if (percentage > 100) return <TrendingUp className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getPositionBadge = (percentage: number | null) => {
    if (percentage === null) {
      return (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Sem faixa
        </Badge>
      );
    }
    
    const { color, label } = getSalaryStatusBadge(percentage);
    
    return (
      <Badge 
        variant="outline" 
        className="text-xs flex items-center gap-1"
        style={{ 
          borderColor: color, 
          color: color,
          backgroundColor: `${color}10`
        }}
      >
        {getPositionIcon(percentage)}
        {label}
      </Badge>
    );
  };

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Todos os Salários
          {employees && (
            <Badge variant="secondary" className="ml-auto">
              {employees.length}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ordenados do maior para o menor
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : !employees || employees.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">Nenhum funcionário encontrado</p>
          </div>
        ) : (
          <ScrollArea className="h-[650px] pr-4">
            <div className="space-y-3">
              {employees.map((employee, index) => {
                const percentage = maxSalary > 0 ? (employee.salary / maxSalary) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-1.5 pb-3 border-b border-border/50 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">
                          {employee.full_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {employee.grade && (
                            <span className="text-xs text-muted-foreground">
                              Grade {employee.grade}
                            </span>
                          )}
                          {employee.job_title && (
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                              • {employee.job_title}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-primary whitespace-nowrap">
                        {formatCurrency(employee.salary)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      {getPositionBadge(employee.salary_range_percentage)}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
