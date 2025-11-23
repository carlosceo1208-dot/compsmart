import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useAuditCharts } from '@/hooks/useAuditCharts';
import { AuditFilters } from '@/hooks/useAuditLogs';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditChartsSectionProps {
  filters: AuditFilters;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const AuditChartsSection = ({ filters }: AuditChartsSectionProps) => {
  const { data: chartsData, isLoading } = useAuditCharts(filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Consultas ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Consultas ao Longo do Tempo</CardTitle>
          <CardDescription>Distribuição diária por agente</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              legal: {
                label: 'Jurídico',
                color: 'hsl(var(--primary))',
              },
              incentive: {
                label: 'R&B',
                color: 'hsl(var(--secondary))',
              },
              total: {
                label: 'Total',
                color: 'hsl(var(--accent))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartsData?.dailyUsage || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="legal" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="incentive" stroke="hsl(var(--secondary))" strokeWidth={2} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Tokens Consumidos por Dia */}
      <Card>
        <CardHeader>
          <CardTitle>Tokens Consumidos</CardTitle>
          <CardDescription>Uso de IA por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              tokens: {
                label: 'Tokens',
                color: 'hsl(var(--primary))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData?.tokensByDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="tokens" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Distribuição por Modo de Operação */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Distribuição por Modo de Operação</CardTitle>
          <CardDescription>Tipos de consulta mais utilizados</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: 'Consultas',
                color: 'hsl(var(--primary))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartsData?.operationModes || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.mode}: ${entry.count}`}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="count"
                >
                  {(chartsData?.operationModes || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
