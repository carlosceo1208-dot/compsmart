import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface Metrics {
  companiesBySize: { name: string; value: number }[];
  companiesByPlan: { name: string; value: number }[];
  companiesBySector: { name: string; value: number }[];
}

interface CompanyDistributionChartsProps {
  metrics: Metrics | undefined;
  isLoading: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export const CompanyDistributionCharts = ({ metrics, isLoading }: CompanyDistributionChartsProps) => {
  if (isLoading) {
    return <Skeleton className="h-[400px] rounded-xl" />;
  }

  const sizeData = metrics?.companiesBySize || [];
  const planData = metrics?.companiesByPlan || [];
  const sectorData = (metrics?.companiesBySector || []).slice(0, 6);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Distribuição de Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="size" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="size">Por Porte</TabsTrigger>
            <TabsTrigger value="plan">Por Plano</TabsTrigger>
            <TabsTrigger value="sector">Por Segmento</TabsTrigger>
          </TabsList>
          
          <TabsContent value="size" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sizeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {sizeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Empresas']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="plan" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [value, 'Empresas']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="sector" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [value, 'Empresas']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
