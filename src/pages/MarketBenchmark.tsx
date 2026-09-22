import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingDown, AlertTriangle } from "lucide-react";
import {
  useMarketCompetitiveness,
  useMarketAlerts,
  useMarketBenchmarkSummary,
} from "@/hooks/useMarketBenchmark";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Navigate } from "react-router-dom";
import { MarketTrendsCard } from "@/components/insight/MarketTrendsCard";
import { MarketReferenceNote } from "@/components/insight/MarketReferenceNote";

const POSITION_LABELS: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  below_market: { label: "Abaixo do Mercado", variant: "destructive" },
  competitive_low: { label: "Competitivo (Q1-Mediana)", variant: "secondary" },
  competitive_high: { label: "Competitivo (Mediana-Q3)", variant: "default" },
  above_market: { label: "Acima do Mercado", variant: "outline" },
};

const SEVERITY_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export default function MarketBenchmark() {
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();
  const { data: summary, isLoading: loadingSummary } = useMarketBenchmarkSummary();
  const { data: comp, isLoading: loadingComp } = useMarketCompetitiveness();
  const { data: alerts, isLoading: loadingAlerts } = useMarketAlerts(15);

  if (roleLoading) return <div className="p-8"><Skeleton className="h-32 w-full" /></div>;
  if (!roleData?.isAdmin && !roleData?.isHR) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="h-7 w-7 text-primary" />
          Insight — Market Benchmark
        </h1>
        <p className="text-muted-foreground mt-1">
          Análise de competitividade salarial vs. pesquisa de mercado ativa
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Cargos Analisados"
          value={summary?.total_matched ?? 0}
          loading={loadingSummary}
        />
        <SummaryCard
          title="Abaixo do Mercado"
          value={summary?.below_market ?? 0}
          loading={loadingSummary}
          tone="destructive"
        />
        <SummaryCard
          title="Competitividade Média"
          value={`${summary?.avg_competitiveness_pct?.toFixed(1) ?? 0}%`}
          loading={loadingSummary}
        />
        <SummaryCard
          title="Alertas Críticos"
          value={summary?.critical_alerts ?? 0}
          loading={loadingSummary}
          tone="destructive"
        />
      </div>

      <MarketTrendsCard />

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertas ({alerts?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="competitiveness">
            <TrendingDown className="h-4 w-4 mr-2" />
            Competitividade ({comp?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Defasagem (gap ≥ 15%)</CardTitle>
              <CardDescription>
                Colaboradores com salário significativamente abaixo da mediana de mercado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarketReferenceNote topic="dissidios_setor" />
              {loadingAlerts ? (
                <Skeleton className="h-64 w-full" />
              ) : !alerts || alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum alerta de defasagem encontrado. 🎉
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-right">Salário Atual</TableHead>
                      <TableHead className="text-right">Mediana Mercado</TableHead>
                      <TableHead className="text-right">Gap</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Recomendação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((a) => (
                      <TableRow key={a.employee_id}>
                        <TableCell className="font-medium">{a.employee_name}</TableCell>
                        <TableCell>{a.job_title}</TableCell>
                        <TableCell>{a.grade}</TableCell>
                        <TableCell className="text-right">
                          R$ {a.internal_salary.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {a.market_median.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-right text-destructive font-semibold">
                          -{a.gap_pct}%
                        </TableCell>
                        <TableCell>
                          <Badge variant={SEVERITY_VARIANT[a.severity]}>{a.severity}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs">
                          {a.recommendation}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitiveness">
          <Card>
            <CardHeader>
              <CardTitle>Posicionamento Competitivo Completo</CardTitle>
              <CardDescription>Todos os cargos com correspondência na pesquisa de mercado</CardDescription>
            </CardHeader>
            <CardContent>
              <MarketReferenceNote topic="praticas_cargo_regiao" />
              {loadingComp ? (
                <Skeleton className="h-64 w-full" />
              ) : !comp || comp.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma correspondência encontrada. Verifique se há pesquisa de mercado ativa.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-right">Salário</TableHead>
                      <TableHead className="text-right">Mediana</TableHead>
                      <TableHead className="text-right">Competitiv.</TableHead>
                      <TableHead>Posição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comp.map((row) => {
                      const pos = POSITION_LABELS[row.market_position];
                      return (
                        <TableRow key={row.employee_id}>
                          <TableCell className="font-medium">{row.employee_name}</TableCell>
                          <TableCell>{row.job_title}</TableCell>
                          <TableCell>{row.grade}</TableCell>
                          <TableCell className="text-right">
                            R$ {row.internal_salary.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {row.market_median.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.competitiveness_pct}%
                          </TableCell>
                          <TableCell>
                            <Badge variant={pos?.variant ?? "outline"}>{pos?.label ?? row.market_position}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  loading,
  tone,
}: {
  title: string;
  value: number | string;
  loading?: boolean;
  tone?: "destructive";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={`text-3xl font-bold ${tone === "destructive" ? "text-destructive" : ""}`}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
