import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users } from 'lucide-react';

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
  const totalEmployees = data.reduce((acc, item) => acc + item.count, 0);

  const calculatePercentage = (count: number) => {
    if (totalEmployees === 0) return '0';
    return ((count / totalEmployees) * 100).toFixed(1);
  };

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
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
