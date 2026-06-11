import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, ShieldAlert, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { AlertSummary } from "@/hooks/usePerformanceAlerts";

interface AlertsCardProps {
  summary: AlertSummary;
  onViewAll?: () => void;
}

export const AlertsCard = ({ summary, onViewAll }: AlertsCardProps) => {
  const chartData = [
    { name: "Atenção", value: summary.attention, color: "#ef4444", icon: AlertTriangle },
    { name: "Neutros", value: summary.neutral, color: "#94a3b8", icon: Info },
    { name: "Positivos", value: summary.positive, color: "#22c55e", icon: CheckCircle },
  ].filter(d => d.value > 0);

  const hasAlerts = summary.total > 0;
  const criticalPercentage = summary.total > 0 ? Math.round((summary.attention / summary.total) * 100) : 0;

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden bg-gradient-to-br from-white to-rose-50/20 dark:from-background dark:to-rose-950/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Alertas de Performance
          </span>
          {summary.unresolved > 0 && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              {summary.unresolved} pendente{summary.unresolved > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasAlerts ? (
          <div className="flex items-center gap-4">
            {/* Donut Chart com visual melhorado */}
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} alertas`, name]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{summary.total}</span>
                <span className="text-[10px] text-muted-foreground">Alertas</span>
              </div>
            </div>

            {/* Breakdown with visual bars */}
            <div className="flex-1 space-y-3">
              {/* Atenção */}
              <div 
                className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 hover:bg-red-100/50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-red-700 dark:text-red-300">Atenção</span>
                      <div className="h-1.5 w-16 bg-red-200 dark:bg-red-800 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: summary.total > 0 ? `${(summary.attention / summary.total) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-red-600">{summary.attention}</span>
                </div>
              </div>

              {/* Neutros */}
              <div 
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-950/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Info className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Neutros</span>
                      <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-slate-400 rounded-full"
                          style={{ width: summary.total > 0 ? `${(summary.neutral / summary.total) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-slate-600">{summary.neutral}</span>
                </div>
              </div>

              {/* Positivos */}
              <div 
                className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Positivos</span>
                      <div className="h-1.5 w-16 bg-emerald-200 dark:bg-emerald-800 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: summary.total > 0 ? `${(summary.positive / summary.total) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-emerald-600">{summary.positive}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-sm font-medium">Nenhum alerta ativo</p>
            <p className="text-xs">Tudo sob controle! 🎉</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
