import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, Bell } from "lucide-react";
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

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas de Performance
          </span>
          {summary.unresolved > 0 && (
            <Badge variant="destructive" className="text-xs">
              {summary.unresolved} pendente{summary.unresolved > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasAlerts ? (
          <div className="flex items-center gap-4">
            {/* Donut Chart */}
            <div className="relative w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
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
                <span className="text-xl font-bold">{summary.total}</span>
                <span className="text-[10px] text-muted-foreground">Total</span>
              </div>
            </div>

            {/* Breakdown with bars */}
            <div className="flex-1 space-y-3">
              {/* Atenção */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-muted-foreground">Atenção</span>
                  </div>
                  <span className="font-semibold text-red-600">{summary.attention}</span>
                </div>
                <div className="h-1.5 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: summary.total > 0 ? `${(summary.attention / summary.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Neutros */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-slate-400" />
                    <span className="text-muted-foreground">Neutros</span>
                  </div>
                  <span className="font-semibold text-slate-600">{summary.neutral}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: summary.total > 0 ? `${(summary.neutral / summary.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Positivos */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span className="text-muted-foreground">Positivos</span>
                  </div>
                  <span className="font-semibold text-emerald-600">{summary.positive}</span>
                </div>
                <div className="h-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: summary.total > 0 ? `${(summary.positive / summary.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <CheckCircle className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhum alerta ativo</p>
            <p className="text-xs">Tudo sob controle! 🎉</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
