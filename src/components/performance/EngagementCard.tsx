import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface EngagementCardProps {
  enps: number | null;
  breakdown: {
    promoters: number;
    neutrals: number;
    detractors: number;
    total: number;
  };
  adherenceRate: number;
}

export const EngagementCard = ({ enps, breakdown, adherenceRate }: EngagementCardProps) => {
  const chartData = [
    { name: "Promotores", value: breakdown.promoters, color: "#22c55e" },
    { name: "Neutros", value: breakdown.neutrals, color: "#94a3b8" },
    { name: "Detratores", value: breakdown.detractors, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const getEnpsStatus = (score: number | null) => {
    if (score === null) return { icon: Minus, color: "text-muted-foreground", label: "Sem dados" };
    if (score >= 50) return { icon: TrendingUp, color: "text-emerald-600", label: "Excelente" };
    if (score >= 0) return { icon: TrendingUp, color: "text-amber-600", label: "Bom" };
    return { icon: TrendingDown, color: "text-red-600", label: "Crítico" };
  };

  const status = getEnpsStatus(enps);
  const StatusIcon = status.icon;

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span>Engajamento (eNPS)</span>
          <div className={`flex items-center gap-1 text-xs ${status.color}`}>
            <StatusIcon className="h-3 w-3" />
            <span>{status.label}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          {/* eNPS Score */}
          <div className="relative w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.length > 0 ? chartData : [{ name: "Empty", value: 1, color: "#e5e7eb" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {(chartData.length > 0 ? chartData : [{ color: "#e5e7eb" }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} colaboradores`, name]}
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
              <span className={`text-2xl font-bold ${status.color}`}>
                {enps !== null ? enps : "—"}
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Promotores</span>
              </div>
              <span className="font-medium">{breakdown.promoters}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-muted-foreground">Neutros</span>
              </div>
              <span className="font-medium">{breakdown.neutrals}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Detratores</span>
              </div>
              <span className="font-medium">{breakdown.detractors}</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Taxa de Adesão</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {adherenceRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
