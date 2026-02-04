import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ArrowRight, Clock, CheckCircle, AlertTriangle, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList } from "recharts";

interface EvaluationsOverviewChartProps {
  totalEvaluations: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  inProgressEvaluations?: number;
  adherenceRate: number;
}

export const EvaluationsOverviewChart = ({ 
  totalEvaluations,
  completedEvaluations,
  pendingEvaluations,
  inProgressEvaluations = 0,
  adherenceRate
}: EvaluationsOverviewChartProps) => {
  const chartData = [
    { 
      name: "Concluídas", 
      value: completedEvaluations, 
      color: "#22c55e",
      icon: CheckCircle,
      percentage: totalEvaluations > 0 ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0
    },
    { 
      name: "Em Análise", 
      value: inProgressEvaluations, 
      color: "#f59e0b",
      icon: Clock,
      percentage: totalEvaluations > 0 ? Math.round((inProgressEvaluations / totalEvaluations) * 100) : 0
    },
    { 
      name: "Pendentes", 
      value: pendingEvaluations, 
      color: "#ef4444",
      icon: AlertTriangle,
      percentage: totalEvaluations > 0 ? Math.round((pendingEvaluations / totalEvaluations) * 100) : 0
    },
  ].filter(d => d.value > 0);

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Avaliações do Ciclo
          </span>
          <Badge 
            variant={adherenceRate >= 80 ? "default" : adherenceRate >= 50 ? "secondary" : "destructive"}
            className={`text-xs ${adherenceRate >= 80 ? 'bg-emerald-600' : ''}`}
          >
            {adherenceRate}% adesão
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {totalEvaluations > 0 ? (
          <div className="space-y-4">
            {/* Stacked Progress Bar - Visual Principal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso Geral</span>
                <span className="font-medium">{completedEvaluations}/{totalEvaluations}</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                {chartData.map((item, index) => (
                  <div
                    key={item.name}
                    className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                    title={`${item.name}: ${item.value} (${item.percentage}%)`}
                  />
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              {chartData.map((item) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={item.name}
                    className="text-center p-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 transition-all"
                  >
                    <div 
                      className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <p className="text-2xl font-bold" style={{ color: item.color }}>
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {item.percentage}%
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Action Button */}
            <Link to="/performance/evaluations" className="block">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
              >
                <ClipboardCheck className="h-3 w-3 mr-2" />
                Gerenciar Avaliações
                <ArrowRight className="h-3 w-3 ml-auto" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileQuestion className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma avaliação no ciclo atual</p>
            <Link to="/performance/evaluations" className="text-xs text-indigo-600 hover:underline mt-1">
              Iniciar avaliações →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
