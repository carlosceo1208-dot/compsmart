import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CompensationBreakdownChartProps {
  salary: number;
  variableSalary: number;
  benefits: number;
  incentives: number;
  title?: string;
}

export const CompensationBreakdownChart = ({
  salary,
  variableSalary,
  benefits,
  incentives,
  title = "Composição do Total Compensation"
}: CompensationBreakdownChartProps) => {
  const total = salary + variableSalary + benefits + incentives;
  
  if (total === 0) return null;

  const data = [
    { 
      name: "Salário Fixo", 
      value: salary, 
      percentage: ((salary / total) * 100).toFixed(1),
      color: "hsl(var(--chart-1))"
    },
    { 
      name: "Variável", 
      value: variableSalary, 
      percentage: ((variableSalary / total) * 100).toFixed(1),
      color: "hsl(var(--chart-2))"
    },
    { 
      name: "Benefícios", 
      value: benefits, 
      percentage: ((benefits / total) * 100).toFixed(1),
      color: "hsl(var(--chart-3))"
    },
    { 
      name: "Incentivos", 
      value: incentives, 
      percentage: ((incentives / total) * 100).toFixed(1),
      color: "hsl(var(--chart-4))"
    },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm font-bold text-primary">{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ percentage }) => `${percentage}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => `${value}: ${entry.payload.percentage}%`}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
