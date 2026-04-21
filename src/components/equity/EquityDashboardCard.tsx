import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Scale, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import {
  usePayGapByGender,
  usePayGapByGrade,
  useSalaryGiniIndex,
  useEquityAlerts,
} from '@/hooks/useEquityAnalytics';

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0);

export function EquityDashboardCard() {
  const { data: role } = useCurrentUserRole();
  const isAuthorized = role?.isAdmin || role?.isHR || role?.isSuperAdmin;

  const gini = useSalaryGiniIndex();
  const gender = usePayGapByGender();
  const grade = usePayGapByGrade();
  const alerts = useEquityAlerts(15);

  if (!isAuthorized) return null;

  const isLoading = gini.isLoading || gender.isLoading || grade.isLoading || alerts.isLoading;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <CardTitle>Equidade & Pay Gap</CardTitle>
          </div>
          <Badge variant="outline">Admin / RH</Badge>
        </div>
        <CardDescription>
          Análise de justiça salarial: gap por gênero, dispersão por grade e índice de Gini.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading && <Skeleton className="h-32 w-full" />}

        {/* Índice de Gini */}
        {gini.data && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Índice de Gini Salarial</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">{gini.data.gini_index?.toFixed(3) ?? '0.000'}</div>
                <div className="text-xs text-muted-foreground">0 = equitativo · 1 = desigual</div>
              </div>
              <div>
                <div className="text-sm font-medium">{gini.data.total_employees}</div>
                <div className="text-xs text-muted-foreground">Funcionários</div>
              </div>
              <div>
                <div className="text-sm font-medium">{fmtMoney(gini.data.total_payroll)}</div>
                <div className="text-xs text-muted-foreground">Folha total</div>
              </div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">{gini.data.interpretation}</p>
          </div>
        )}

        {/* Pay Gap por Gênero */}
        {gender.data && gender.data.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Pay Gap por Gênero</h4>
            </div>
            <div className="space-y-2">
              {gender.data.map((row) => (
                <div key={row.gender} className="flex items-center justify-between p-2 rounded border bg-card text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{row.gender}</span>
                    <span className="text-xs text-muted-foreground">({row.employee_count})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{fmtMoney(row.avg_salary)}</span>
                    {row.gap_vs_male_percentage !== null && row.gap_vs_male_percentage !== 0 && (
                      <Badge variant={Math.abs(row.gap_vs_male_percentage) > 10 ? 'destructive' : 'secondary'}>
                        {row.gap_vs_male_percentage > 0 ? '+' : ''}
                        {row.gap_vs_male_percentage.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertas de Inequidade */}
        {alerts.data && alerts.data.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h4 className="font-semibold text-sm">Alertas de Inequidade Interna ({alerts.data.length})</h4>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.data.slice(0, 8).map((a, idx) => (
                <Alert key={idx} variant={a.severity === 'crítico' ? 'destructive' : 'default'}>
                  <AlertTitle className="text-sm flex items-center justify-between">
                    <span>{a.job_title} — Grade {a.grade}</span>
                    <Badge variant={a.severity === 'crítico' ? 'destructive' : 'outline'}>
                      {a.severity}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {a.employee_count} funcionários · {fmtMoney(a.min_salary)} → {fmtMoney(a.max_salary)} ·{' '}
                    <strong>gap {a.gap_percentage.toFixed(1)}%</strong>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Dispersão por Grade */}
        {grade.data && grade.data.length > 0 && (
          <details className="rounded border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Coeficiente de variação por Grade ({grade.data.length})
            </summary>
            <div className="mt-3 space-y-1 text-xs">
              {grade.data.map((g) => (
                <div key={g.grade} className="flex justify-between border-b pb-1">
                  <span>Grade {g.grade} ({g.employee_count})</span>
                  <span className={g.coefficient_variation > 25 ? 'text-destructive font-medium' : ''}>
                    CV {g.coefficient_variation.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
