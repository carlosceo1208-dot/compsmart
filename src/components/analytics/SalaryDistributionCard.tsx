import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';

interface DistributionItem {
  category: string;
  count: number;
  color: string;
  badge: string;
}

interface SalaryDistributionCardProps {
  data: DistributionItem[];
  isLoading?: boolean;
}

export const SalaryDistributionCard = ({ data, isLoading }: SalaryDistributionCardProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const totalEmployees = data.reduce((acc, item) => acc + item.count, 0);

  const calculatePercentage = (count: number) => {
    if (totalEmployees === 0) return '0';
    return ((count / totalEmployees) * 100).toFixed(1);
  };

  const getCategoryRange = (category: string): [number, number] => {
    switch (category) {
      case 'Abaixo do Mínimo':
        return [-Infinity, 0];
      case 'Início da Faixa':
        return [0, 40];
      case 'Próximo ao Mercado':
        return [40, 60];
      case 'Acima do Mercado':
        return [60, 100];
      case 'Acima da Faixa':
        return [100, Infinity];
      default:
        return [0, 0];
    }
  };

  const { data: categoryEmployees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['category-employees', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      
      const [min, max] = getCategoryRange(selectedCategory);
      let query = supabase
        .from('profiles')
        .select('full_name, salary, salary_range_percentage, grade, job_title')
        .not('salary', 'is', null)
        .not('salary_range_percentage', 'is', null);

      if (min === -Infinity) {
        query = query.lt('salary_range_percentage', max);
      } else if (max === Infinity) {
        query = query.gt('salary_range_percentage', min);
      } else {
        query = query.gte('salary_range_percentage', min).lt('salary_range_percentage', max);
      }

      const { data, error } = await query.order('salary_range_percentage', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCategory,
    staleTime: 2 * 60 * 1000,
  });

  const selectedItem = data.find(item => item.category === selectedCategory);

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Distribuição por Faixa Salarial
        </CardTitle>
        <CardDescription>
          Posicionamento dos funcionários em relação às faixas salariais de mercado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum dado disponível</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gráfico de Pizza */}
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Lista de Badges com Contadores */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Total: {totalEmployees} funcionários
              </h4>
              <div className="space-y-2">
                {data.map((item) => (
                  <div 
                    key={item.category}
                    onClick={() => setSelectedCategory(item.category)}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.badge}</span>
                      <span className="font-medium text-sm">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        style={{ backgroundColor: item.color }}
                        className="text-white font-bold min-w-[60px] justify-center"
                      >
                        {item.count}
                      </Badge>
                      <span className="text-sm text-muted-foreground min-w-[50px] text-right">
                        {calculatePercentage(item.count)}%
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedItem?.badge}</span>
              {selectedCategory}
            </DialogTitle>
            <DialogDescription>
              {categoryEmployees?.length || 0} funcionário(s) nesta faixa salarial
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingEmployees ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : categoryEmployees && categoryEmployees.length > 0 ? (
            <div className="space-y-3">
              {categoryEmployees.map((employee, idx) => (
                <div 
                  key={idx}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-base">{employee.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.job_title || 'Cargo não definido'} • Grade {employee.grade || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-base">{formatCurrency(employee.salary)}</p>
                    <Badge 
                      style={{ backgroundColor: selectedItem?.color }}
                      className="text-white"
                    >
                      {employee.salary_range_percentage.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum funcionário encontrado nesta categoria
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
