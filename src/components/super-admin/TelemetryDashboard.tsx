import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface UsageRow {
  module_name: string | null;
  event_category: string;
  company_id: string;
  user_id: string;
  created_at: string;
}

interface ErrorRow {
  id: string;
  error_message: string;
  severity: string;
  route_path: string | null;
  created_at: string;
}

const SEVENS_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const TelemetryDashboard = () => {
  const since = new Date(Date.now() - SEVENS_DAYS_MS).toISOString();

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['telemetry-usage-7d'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usage_events')
        .select('module_name, event_category, company_id, user_id, created_at')
        .gte('created_at', since)
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as UsageRow[];
    },
  });

  const { data: errors, isLoading: errorsLoading } = useQuery({
    queryKey: ['telemetry-errors-7d'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('id, error_message, severity, route_path, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ErrorRow[];
    },
  });

  if (usageLoading || errorsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const events = usage ?? [];
  const uniqueCompanies = new Set(events.map(e => e.company_id)).size;
  const uniqueUsers = new Set(events.map(e => e.user_id)).size;
  const totalEvents = events.length;
  const criticalErrors = (errors ?? []).filter(e => e.severity === 'critical').length;

  // Eventos por módulo
  const byModule: Record<string, number> = {};
  for (const e of events) {
    const m = e.module_name ?? 'outros';
    byModule[m] = (byModule[m] ?? 0) + 1;
  }
  const moduleData = Object.entries(byModule)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={Activity} label="Eventos (7d)" value={totalEvents.toLocaleString('pt-BR')} />
        <KpiCard icon={Users} label="Usuários Ativos" value={uniqueUsers.toString()} />
        <KpiCard icon={TrendingUp} label="Empresas Ativas" value={uniqueCompanies.toString()} />
        <KpiCard icon={AlertCircle} label="Erros Críticos" value={criticalErrors.toString()} accent={criticalErrors > 0 ? 'destructive' : 'default'} />
      </div>

      {/* Top módulos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uso por Módulo (últimos 7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {moduleData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sem dados ainda. Os eventos começarão a aparecer conforme a plataforma for utilizada.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={moduleData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Últimos erros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos Erros</CardTitle>
        </CardHeader>
        <CardContent>
          {(errors ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sem erros registrados nos últimos 7 dias. 🎉</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {(errors ?? []).map(err => (
                <div key={err.id} className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
                  <Badge variant={err.severity === 'critical' ? 'destructive' : 'secondary'} className="shrink-0">
                    {err.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{err.error_message}</p>
                    <p className="text-xs text-muted-foreground">
                      {err.route_path ?? '—'} · {new Date(err.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, accent = 'default' }: { icon: typeof Activity; label: string; value: string; accent?: 'default' | 'destructive' }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={`h-4 w-4 ${accent === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
      </div>
      <div className={`text-2xl font-bold ${accent === 'destructive' ? 'text-destructive' : ''}`}>{value}</div>
    </CardContent>
  </Card>
);
