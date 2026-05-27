import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, ShieldCheck, Users, Download, Lock } from 'lucide-react';
import { useCompensationMismatchKPI, useTopMismatches } from '@/hooks/useMeritIntelligence';
import { AiBadge } from '@/components/ui/ai-badge';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Link } from 'react-router-dom';
import { exportToCSV } from '@/lib/csvExport';
import { toast } from 'sonner';

const severityStyle: Record<string, string> = {
  'crítico': 'bg-destructive/15 text-destructive border-destructive/30',
  'alto': 'bg-warning/15 text-warning border-warning/30',
  'médio': 'bg-muted text-muted-foreground border-border',
};

export function MeritCoherenceCard() {
  const { data: userRole, isLoading: roleLoading } = useCurrentUserRole();

  // Apenas Admin / HR / Super Admin podem ver inteligência de mérito × salário.
  // Managers individuais NÃO têm acesso à visão agregada (LGPD + governança).
  const canViewIntelligence =
    !!userRole && (userRole.isAdmin || userRole.isHR || userRole.isSuperAdmin);

  const { data: kpi, isLoading: kpiLoading, error: kpiError } = useCompensationMismatchKPI();
  const { data: top, isLoading: topLoading } = useTopMismatches(20);

  // Aguarda role carregar para evitar flash
  if (roleLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Sem permissão → card discreto explicando restrição (sem vazar dados)
  if (!canViewIntelligence) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          <p className="text-xs">
            Inteligência de Mérito × Salário disponível apenas para RH e Administradores.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Erro de RLS / backend → esconde silenciosamente
  if (kpiError) return null;

  const isHealthy = (kpi?.mismatch_percentage ?? 0) < 5;

  const handleExport = () => {
    if (!top || top.length === 0) {
      toast.info('Nenhum dado para exportar');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    exportToCSV(
      `compsmart_top_mismatches_${today}.csv`,
      [
        { header: 'Funcionário', accessor: (r) => r.full_name },
        { header: 'Cargo', accessor: (r) => r.job_title ?? '' },
        {
          header: 'Performance',
          accessor: (r) =>
            r.performance_score != null ? r.performance_score.toFixed(2) : '',
        },
        {
          header: '% na Faixa Salarial',
          accessor: (r) =>
            r.salary_range_percentage != null
              ? r.salary_range_percentage.toFixed(1)
              : '',
        },
        { header: 'Severidade', accessor: (r) => r.mismatch_severity },
      ],
      top,
      ';'
    );
    toast.success(`${top.length} registros exportados`);
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Coerência Mérito × Salário</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Performance vs. posição na faixa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!kpiLoading && kpi && (
              <Badge variant={isHealthy ? 'secondary' : 'destructive'}>
                {isHealthy ? (
                  <ShieldCheck className="h-3 w-3 mr-1" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {kpi.mismatch_percentage.toFixed(1)}%
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleExport}
              disabled={topLoading || !top || top.length === 0}
              title="Exportar CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {kpiLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : kpi ? (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-md bg-muted/50">
                <Users className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                <div className="text-lg font-bold">{kpi.total_employees}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Total</div>
              </div>
              <div className="p-2 rounded-md bg-destructive/10">
                <div className="text-lg font-bold text-destructive">{kpi.high_perf_low_salary}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Alta perf<br/>+ baixo $</div>
              </div>
              <div className="p-2 rounded-md bg-warning/10">
                <div className="text-lg font-bold text-warning">
                  {kpi.low_perf_high_salary}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">Baixa perf<br/>+ alto $</div>
              </div>
            </div>

            {!isHealthy && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {kpi.total_mismatches} talento(s) com incoerência. Revise para evitar turnover.
                </AlertDescription>
              </Alert>
            )}

            {topLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : top && top.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Casos prioritários
                </p>
                {top.slice(0, 3).map((emp) => (
                  <Link
                    key={emp.employee_id}
                    to={`/employees?highlight=${emp.employee_id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{emp.full_name}</p>
                      <p className="text-muted-foreground truncate">{emp.job_title ?? '—'}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${severityStyle[emp.mismatch_severity]}`}
                    >
                      {emp.mismatch_severity}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-muted-foreground py-2">
                ✅ Nenhuma incoerência crítica detectada
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
