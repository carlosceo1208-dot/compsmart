import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Users, Sparkles, HelpCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ENPSInfoDialog } from "./ENPSInfoDialog";

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
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  
  const chartData = [
    { name: "Promotores", value: breakdown.promoters, color: "#22c55e" },
    { name: "Neutros", value: breakdown.neutrals, color: "#94a3b8" },
    { name: "Detratores", value: breakdown.detractors, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const getEnpsStatus = (score: number | null) => {
    if (score === null) return { icon: Minus, color: "text-muted-foreground", label: "Sem dados", bgColor: "bg-muted" };
    if (score >= 50) return { icon: TrendingUp, color: "text-emerald-600", label: "Excelente", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" };
    if (score >= 0) return { icon: TrendingUp, color: "text-amber-600", label: "Bom", bgColor: "bg-amber-100 dark:bg-amber-900/30" };
    return { icon: TrendingDown, color: "text-red-600", label: "Crítico", bgColor: "bg-red-100 dark:bg-red-900/30" };
  };

  const status = getEnpsStatus(enps);
  const StatusIcon = status.icon;

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 dark:from-background dark:to-indigo-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Engajamento (eNPS)
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
              onClick={() => setShowInfoDialog(true)}
              title="O que é eNPS?"
            >
              <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
            </Button>
          </span>
          <Badge className={`${status.bgColor} ${status.color} border-0`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-6">
          {/* eNPS Score - Visual Principal */}
          <div className="relative">
            <div className="w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.length > 0 ? chartData : [{ name: "Empty", value: 1, color: "#e5e7eb" }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
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
                <span className={`text-3xl font-bold ${status.color}`}>
                  {enps !== null ? enps : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground">eNPS Score</span>
              </div>
            </div>
          </div>

          {/* Breakdown com barras visuais */}
          <div className="flex-1 space-y-3">
            {/* Promotores */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                  <span className="font-medium">Promotores</span>
                </div>
                <span className="font-bold text-emerald-600">{breakdown.promoters}</span>
              </div>
              <div className="h-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: breakdown.total > 0 ? `${(breakdown.promoters / breakdown.total) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Neutros */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm shadow-slate-400/30" />
                  <span className="font-medium">Neutros</span>
                </div>
                <span className="font-bold text-slate-600">{breakdown.neutrals}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-slate-300 to-slate-400 rounded-full transition-all duration-700"
                  style={{ width: breakdown.total > 0 ? `${(breakdown.neutrals / breakdown.total) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Detratores */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/30" />
                  <span className="font-medium">Detratores</span>
                </div>
                <span className="font-bold text-red-600">{breakdown.detractors}</span>
              </div>
              <div className="h-2 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-700"
                  style={{ width: breakdown.total > 0 ? `${(breakdown.detractors / breakdown.total) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Footer Stats */}
            <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                  <Users className="h-3 w-3" />
                  Total Avaliados
                </div>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {breakdown.total}
                </span>
              </div>
              <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <div className="text-xs text-muted-foreground mb-0.5">
                  Taxa de Adesão
                </div>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {adherenceRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <ENPSInfoDialog open={showInfoDialog} onOpenChange={setShowInfoDialog} />
      </CardContent>
    </Card>
  );
};
