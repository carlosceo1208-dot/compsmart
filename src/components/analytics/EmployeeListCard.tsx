import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, User } from 'lucide-react';

interface Employee {
  full_name: string;
  salary: number;
}

interface EmployeeListCardProps {
  employees: Employee[] | undefined;
  isLoading?: boolean;
  limit?: number;
}

export const EmployeeListCard = ({ employees, isLoading, limit = 10 }: EmployeeListCardProps) => {
  const maxSalary = employees && employees.length > 0 
    ? Math.max(...employees.map(e => e.salary)) 
    : 0;

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Top {limit} Maiores Salários
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : !employees || employees.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
            <User className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">Nenhum funcionário encontrado</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {employees.slice(0, limit).map((employee, index) => {
                const percentage = maxSalary > 0 ? (employee.salary / maxSalary) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight flex-1">
                        {employee.full_name}
                      </p>
                      <p className="text-sm font-semibold text-primary whitespace-nowrap">
                        {formatCurrency(employee.salary)}
                      </p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
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
