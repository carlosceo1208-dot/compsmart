import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import type { SecurityMetrics } from '@/hooks/useSecurityDashboard';

interface SecurityTimelineProps {
  metrics?: SecurityMetrics;
  isLoading: boolean;
}

export function SecurityTimeline({ metrics, isLoading }: SecurityTimelineProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tentativas por Hora (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics?.attemptsByHour || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="success" 
                  name="Sucesso"
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  name="Falha"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Failed IPs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 IPs com Falhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {metrics?.topFailedIPs && metrics.topFailedIPs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={metrics.topFailedIPs} 
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis 
                    dataKey="ip" 
                    type="category" 
                    tick={{ fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Falhas"
                    fill="hsl(var(--destructive))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nenhuma falha registrada nas últimas 24h
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
