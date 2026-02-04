import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid 
} from "recharts";

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
  
  const statusData = [
    { name: "Atingidas", value: achievedGoals, color: "#22c55e" },
    { name: "Em Progresso", value: activeGoals, color: "#3b82f6" },
    { name: "Pendentes", value: pendingGoals, color: "#94a3b8" },
    { name: "Atrasadas", value: overdueGoals, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Mock data for types distribution (inspired by Elofy)
  const typesData = [
    { name: "Individual", value: Math.ceil(total * 0.4), color: "#a855f7" },
    { name: "Equipe", value: Math.ceil(total * 0.3), color: "#3b82f6" },
    { name: "Empresa", value: Math.ceil(total * 0.2), color: "#1e3a5f" },
    { name: "Departamento", value: Math.ceil(total * 0.1), color: "#fbbf24" },
  ].filter(d => d.value > 0);

  // Mock trend data for line chart
  const trendData = [
    { month: "Jan", value: 2 },
    { month: "Fev", value: 4 },
    { month: "Mar", value: 3 },
    { month: "Abr", value: 6 },
    { month: "Mai", value: 4 },
    { month: "Jun", value: 5 },
  ];

  // Bar chart data by priority
  const priorityData = [
    { name: "Alta", value: Math.ceil(achievedGoals * 0.5) || 1, fill: "#a855f7" },
    { name: "Média", value: Math.ceil(activeGoals * 0.6) || 1, fill: "#a855f7" },
    { name: "Baixa", value: Math.ceil(pendingGoals * 0.4) || 1, fill: "#a855f7" },
    { name: "Crítica", value: Math.ceil(overdueGoals * 0.3) || 1, fill: "#a855f7" },
  ];

  const completionRate = total > 0 
    ? Math.round((achievedGoals / total) * 100) 
    : 0;

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '11px',
  };

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Gestão de Metas OKRs
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
          <div className="grid grid-cols-3 gap-3">
            {/* Row 1: Progress Donut + Types Donut + Line Chart */}
            
            {/* Progress Donut */}
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-1 font-medium">Objetivo | Progresso</p>
              <div className="relative h-24 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}`, '']} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-foreground">{completionRate}%</span>
                </div>
              </div>
            </div>

            {/* Types Donut */}
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-1 font-medium">Objetivo | Tipos</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="space-y-1">
                    {typesData.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5 text-[9px]">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-20 w-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={35}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {typesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}`, '']} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Line Chart - Trend */}
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-1 font-medium">Objetivo | Evolução</p>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      dot={{ fill: "#a855f7", strokeWidth: 0, r: 3 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} metas`, '']} 
                      contentStyle={tooltipStyle}
                      labelStyle={{ fontSize: '10px' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 2: Total Count + Bar Chart */}
            
            {/* Total Count */}
            <div className="bg-muted/30 rounded-lg p-3 flex flex-col justify-center">
              <p className="text-[10px] text-muted-foreground mb-1 font-medium">Objetivo | Total</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-foreground">{String(total).padStart(2, '0')}</span>
                <div className="flex flex-col text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    +{achievedGoals} concluídas
                  </span>
                </div>
              </div>
            </div>

            {/* Bar Chart - By Priority */}
            <div className="bg-muted/30 rounded-lg p-3 col-span-2">
              <p className="text-[10px] text-muted-foreground mb-1 font-medium">Objetivo | Por Prioridade</p>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} barCategoryGap="20%">
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} 
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[4, 4, 0, 0]}
                      fill="#a855f7"
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} metas`, '']} 
                      contentStyle={tooltipStyle}
                    />
                  </BarChart>
                </ResponsiveContainer>
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
