import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface GoalsProgressChartProps {
  activeGoals: number;
  achievedGoals: number;
  pendingGoals?: number;
  overdueGoals?: number;
}

export const GoalsProgressChart = ({ 
  activeGoals, 
  achievedGoals,
  pendingGoals = 0,
  overdueGoals = 0
}: GoalsProgressChartProps) => {
  const total = activeGoals + achievedGoals + pendingGoals + overdueGoals;
  
  const chartData = [
    { name: "Atingidas", value: achievedGoals, color: "#22c55e" },
    { name: "Em Progresso", value: activeGoals, color: "#3b82f6" },
    { name: "Pendentes", value: pendingGoals, color: "#94a3b8" },
    { name: "Atrasadas", value: overdueGoals, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const completionRate = total > 0 
    ? Math.round((achievedGoals / total) * 100) 
    : 0;

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Progresso das Metas
          </span>
          <Link to="/performance/goals">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-indigo-600 hover:text-indigo-700">
              Ver todas
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {total > 0 ? (
          <div className="flex items-center gap-4">
            {/* Donut Chart */}
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
                    formatter={(value: number, name: string) => [`${value} metas`, name]}
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
                <span className="text-2xl font-bold text-emerald-600">{completionRate}%</span>
                <span className="text-[10px] text-muted-foreground">Concluídas</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3">
              {/* Progress bars */}
              <div className="space-y-2">
                {chartData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${(item.value / total) * 100}%`,
                          backgroundColor: item.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total indicator */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total de metas</span>
                <Badge variant="secondary" className="text-xs">
                  {total}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma meta cadastrada</p>
            <Link to="/performance/goals" className="text-xs text-indigo-600 hover:underline mt-1">
              Criar primeira meta →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
