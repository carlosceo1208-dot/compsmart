import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight, Award, Calendar, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface FeedbackAnalyticsChartProps {
  kudosThisMonth: number;
  oneOnOnesThisMonth: number;
  feedbacksSent?: number;
  feedbacksReceived?: number;
}

export const FeedbackAnalyticsChart = ({ 
  kudosThisMonth, 
  oneOnOnesThisMonth,
  feedbacksSent = 0,
  feedbacksReceived = 0
}: FeedbackAnalyticsChartProps) => {
  const chartData = [
    { name: "Reconhecimento", value: kudosThisMonth, color: "#ec4899", icon: Award },
    { name: "1:1s", value: oneOnOnesThisMonth, color: "#8b5cf6", icon: Calendar },
    { name: "Feedbacks Enviados", value: feedbacksSent, color: "#3b82f6", icon: MessageSquare },
    { name: "Feedbacks Recebidos", value: feedbacksReceived, color: "#22c55e", icon: ThumbsUp },
  ];

  const totalFeedback = kudosThisMonth + oneOnOnesThisMonth + feedbacksSent + feedbacksReceived;

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback - Este Mês
          </span>
          <Badge 
            variant="outline" 
            className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 text-pink-700 dark:text-pink-300 border-pink-200"
          >
            {totalFeedback} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {totalFeedback > 0 ? (
          <div className="space-y-4">
            {/* Horizontal Bar Chart */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.filter(d => d.value > 0)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} atividades`]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              {chartData.map((item) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={item.name}
                    className="text-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div 
                      className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <Icon 
                        className="h-4 w-4" 
                        style={{ color: item.color }}
                      />
                    </div>
                    <p className="text-lg font-bold" style={{ color: item.color }}>
                      {item.value}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {item.name.split(' ')[0]}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link to="/performance/kudos" className="flex-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs h-8 border-pink-200 text-pink-700 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-300 dark:hover:bg-pink-950/30"
                >
                  <Award className="h-3 w-3 mr-1" />
                  Enviar Kudos
                </Button>
              </Link>
              <Link to="/performance/one-on-ones" className="flex-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs h-8 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/30"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Agendar 1:1
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Sem atividades de feedback este mês</p>
            <p className="text-xs text-center mt-1">
              Envie kudos ou agende 1:1s para fortalecer a cultura de feedback
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
