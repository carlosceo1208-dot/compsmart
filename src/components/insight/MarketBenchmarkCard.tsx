import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";
import { useMarketBenchmarkSummary, useMarketAlerts } from "@/hooks/useMarketBenchmark";
import { useUserRole } from "@/hooks/useUserRole";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MarketBenchmarkCard() {
  const { role } = useUserRole();
  const { data: summary, isLoading } = useMarketBenchmarkSummary();
  const { data: alerts } = useMarketAlerts(15);

  const canView = role === "admin" || role === "hr_manager";
  if (!canView) return null;

  const criticalAlerts = alerts?.filter((a) => a.severity === "critical").slice(0, 3) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Insight — Benchmark de Mercado
            </CardTitle>
            <CardDescription>
              Competitividade salarial vs. pesquisa de mercado ativa
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/market-benchmark">Ver detalhes</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !summary || summary.total_matched === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma pesquisa de mercado ativa correspondente aos cargos atuais.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricBox
                label="Cargos Analisados"
                value={summary.total_matched}
                icon={<Target className="h-4 w-4" />}
              />
              <MetricBox
                label="Defasados"
                value={summary.below_market}
                icon={<TrendingDown className="h-4 w-4 text-destructive" />}
                tone="destructive"
              />
              <MetricBox
                label="Competitivos"
                value={summary.competitive}
                icon={<Target className="h-4 w-4 text-primary" />}
                tone="primary"
              />
              <MetricBox
                label="Acima Mercado"
                value={summary.above_market}
                icon={<TrendingUp className="h-4 w-4" />}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <div>
                <div className="text-xs text-muted-foreground">Competitividade Média</div>
                <div className="text-2xl font-bold">
                  {summary.avg_competitiveness_pct?.toFixed(1) ?? 0}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Gap Total Mensal</div>
                <div className="text-lg font-semibold text-destructive">
                  R$ {Number(summary.total_gap_amount ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            {criticalAlerts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Alertas Críticos ({summary.critical_alerts})
                </div>
                {criticalAlerts.map((a) => (
                  <div
                    key={a.employee_id}
                    className="flex items-center justify-between p-2 rounded border border-destructive/30 bg-destructive/5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{a.employee_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {a.job_title} · {a.grade}
                      </div>
                    </div>
                    <Badge variant="destructive" className="ml-2 shrink-0">
                      -{a.gap_pct}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBox({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "destructive" | "primary";
}) {
  return (
    <div className="p-3 rounded-md border bg-card">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div
        className={`text-2xl font-bold mt-1 ${
          tone === "destructive" ? "text-destructive" : tone === "primary" ? "text-primary" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
