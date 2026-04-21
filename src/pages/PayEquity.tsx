import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scale, AlertTriangle, ShieldCheck, Users, RefreshCw } from 'lucide-react';
import {
  usePayEquityAlerts,
  useDetectEquityGaps,
  useUpdateEquityAlert,
  usePayEquityByGender,
  usePayEquityByRace,
} from '@/hooks/usePayEquity';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { formatDateBRFromISODate } from '@/lib/date';
import { PayEquityRegressionCard } from '@/components/equity/PayEquityRegressionCard';

const formatBRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0));

const severityColor: Record<string, string> = {
  low: 'bg-yellow-500/10 text-yellow-700',
  medium: 'bg-orange-500/10 text-orange-700',
  high: 'bg-red-500/10 text-red-700',
  critical: 'bg-red-700/20 text-red-900',
};

export default function PayEquity() {
  const { data: role } = useCurrentUserRole();
  const allowed = role?.isAdmin || role?.isSuperAdmin || role?.isHR;

  const { data: alerts = [], isLoading } = usePayEquityAlerts();
  const { data: genderData = [] } = usePayEquityByGender();
  const { data: raceData = [] } = usePayEquityByRace();
  const detect = useDetectEquityGaps();
  const update = useUpdateEquityAlert();

  if (!allowed) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Acesso restrito a Admin/RH (dados sensíveis LGPD).
          </CardContent>
        </Card>
      </div>
    );
  }

  const openAlerts = alerts.filter((a) => a.status === 'open').length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && a.status === 'open').length;

  return (
    <div className="p-4 md:p-6 space-y-6 h-[calc(100vh-8rem)] overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Scale className="h-7 w-7 text-primary" />
            Pay Equity & Fairness
          </h1>
          <p className="text-sm text-muted-foreground">
            Análise de equidade salarial — relatório auditável (LGPD/ESG)
          </p>
        </div>
        <Button onClick={() => detect.mutate()} disabled={detect.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${detect.isPending ? 'animate-spin' : ''}`} />
          Detectar Gaps
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Alertas Abertos</div>
              <div className="text-xl font-bold">{openAlerts}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Críticos</div>
              <div className="text-xl font-bold">{criticalAlerts}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Resolvidos</div>
              <div className="text-xl font-bold">
                {alerts.filter((a) => a.status === 'remediated').length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/30 text-secondary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Grupos analisados</div>
              <div className="text-xl font-bold">{genderData.length + raceData.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertas de Inequidade</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">Carregando...</div>
          ) : alerts.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              Nenhum alerta. Clique em "Detectar Gaps" para iniciar análise.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cargo / Grade</TableHead>
                    <TableHead>Comparação</TableHead>
                    <TableHead className="text-right">Gap %</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detectado em</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Badge variant="outline">{a.alert_type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        {a.job_title ?? '-'} {a.grade ? `· ${a.grade}` : ''}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.group_a_label}: {formatBRL(a.group_a_avg_salary)} ↔ {a.group_b_label}: {formatBRL(a.group_b_avg_salary)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {a.gap_percentage?.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${severityColor[a.severity]}`}>
                          {a.severity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'open' ? 'destructive' : 'secondary'}>{a.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateBRFromISODate(a.created_at.slice(0, 10))}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {a.status === 'open' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => update.mutate({ id: a.id, status: 'reviewing' })}
                            >
                              Revisar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                update.mutate({ id: a.id, status: 'remediated', resolution_notes: 'Ajuste aplicado' })
                              }
                            >
                              Resolver
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise multivariada (gap explicado vs não-explicado) */}
      <PayEquityRegressionCard />
    </div>
  );
}
