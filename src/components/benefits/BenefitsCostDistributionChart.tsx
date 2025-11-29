import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBenefitsCostDistribution } from '@/hooks/useBenefitsCostDistribution';
import { formatCurrency, formatDecimal } from '@/lib/formatters';
import { BarChart3 } from 'lucide-react';

export const BenefitsCostDistributionChart = () => {
  const { data, isLoading } = useBenefitsCostDistribution();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Custos por Benefício</CardTitle>
          <CardDescription>Divisão percentual entre empresa e funcionário</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Custos por Benefício</CardTitle>
          <CardDescription>Divisão percentual entre empresa e funcionário</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum benefício com atribuições ativas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para gráfico empilhado (100%)
  const chartData = data.map(item => ({
    name: item.name.length > 20 ? item.name.substring(0, 18) + '...' : item.name,
    fullName: item.name,
    Empresa: item.companyPercent,
    Funcionário: item.employeePercent,
    companyCost: item.companyCost,
    employeeCost: item.employeeCost,
    totalCost: item.totalCost,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    
    return (
      <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-2">{data?.fullName}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span>Empresa:</span>
            </div>
            <span className="font-medium">
              {formatDecimal(data?.Empresa, 1)}% ({formatCurrency(data?.companyCost)})
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(25, 95%, 53%)' }} />
              <span>Funcionário:</span>
            </div>
            <span className="font-medium">
              {formatDecimal(data?.Funcionário, 1)}% ({formatCurrency(data?.employeeCost)})
            </span>
          </div>
          <div className="border-t pt-1 mt-1 flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold">{formatCurrency(data?.totalCost)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Custos por Benefício</CardTitle>
        <CardDescription>
          Divisão percentual entre empresa e funcionário (100% = custo total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 45)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted" />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              type="category" 
              dataKey="name"
              width={150}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
            <Bar 
              dataKey="Empresa" 
              stackId="stack" 
              fill="hsl(var(--primary))"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="Funcionário" 
              stackId="stack" 
              fill="hsl(25, 95%, 53%)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
