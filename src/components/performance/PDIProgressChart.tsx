import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PDIProgressChartProps {
  activePdis: number;
  completedPdis: number;
  overduePdis?: number;
  pendingPdis?: number;
}

export const PDIProgressChart = ({ 
  activePdis, 
  completedPdis,
  overduePdis = 0,
  pendingPdis = 0
}: PDIProgressChartProps) => {
  const total = activePdis + completedPdis + overduePdis + pendingPdis;
  
  const chartData = [
    { name: "Concluídos", value: completedPdis, color: "#22c55e", icon: CheckCircle },
    { name: "Em Progresso", value: activePdis, color: "#3b82f6", icon: Clock },
    { name: "Pendentes", value: pendingPdis, color: "#94a3b8", icon: FileText },
    { name: "Atrasados", value: overduePdis, color: "#ef4444", icon: AlertCircle },
  ].filter(d => d.value > 0);

  const completionRate = total > 0 
    ? Math.round((completedPdis / total) * 100) 
    : 0;

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Planos de Desenvolvimento (PDI)
          </span>
          <Link to="/performance/pdi">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-indigo-600 hover:text-indigo-700">
              Ver todos
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {total > 0 ? (
          <div className="flex items-center gap-4">
            {/* Semi-circle Progress */}
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
                    formatter={(value: number, name: string) => [`${value} PDIs`, name]}
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
                <span className="text-xl font-bold text-blue-600">{completionRate}%</span>
                <span className="text-[9px] text-muted-foreground">Taxa Concl.</span>
              </div>
            </div>

            {/* Legend with mini stats */}
            <div className="flex-1 space-y-2">
              {chartData.map((item) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <Icon className="h-3 w-3" style={{ color: item.color }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <span 
                      className="text-sm font-bold" 
                      style={{ color: item.color }}
                    >
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum PDI cadastrado</p>
            <Link to="/performance/pdi" className="text-xs text-indigo-600 hover:underline mt-1">
              Criar primeiro PDI →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
