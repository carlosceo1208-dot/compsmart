import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlySummary {
  month: number;
  totalFixed: number;
  totalVariable: number;
  totalBenefits: number;
  totalCash: number;
  headcount: number;
}

interface BudgetEvolutionChartProps {
  monthlyTotals: MonthlySummary[];
  isLoading?: boolean;
  fiscalYear: number;
}

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const totalMonth = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
        <p className="font-bold text-sm mt-2 pt-2 border-t">
          Total: {formatCurrency(totalMonth)}
        </p>
      </div>
    );
  }
  return null;
};

export const BudgetEvolutionChart = ({ monthlyTotals, isLoading, fiscalYear }: BudgetEvolutionChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = monthlyTotals.map((summary) => ({
    month: monthNames[summary.month - 1],
    'Salário Fixo': summary.totalFixed,
    'Variável': summary.totalVariable,
    'Benefícios': summary.totalBenefits,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Evolução Mensal do Orçamento {fiscalYear}</CardTitle>
        </div>
        <CardDescription>
          Distribuição mensal por categoria: Salário Fixo, Variável e Benefícios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
              />
              <Bar 
                dataKey="Salário Fixo" 
                stackId="a" 
                fill="hsl(var(--primary))" 
                name="Salário Fixo" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="Variável" 
                stackId="a" 
                fill="hsl(24, 95%, 53%)" 
                name="Variável" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="Benefícios" 
                stackId="a" 
                fill="hsl(142, 71%, 45%)" 
                name="Benefícios" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
