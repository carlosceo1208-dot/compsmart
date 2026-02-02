import { Card, CardContent } from "@/components/ui/card";
import { 
  Target, 
  ClipboardCheck, 
  FileText, 
  Award,
  Calendar,
  TrendingUp,
  MessageSquare,
  Users
} from "lucide-react";
import type { EngagementMetrics } from "@/hooks/useEngagementMetrics";

interface PerformanceKPICardsProps {
  metrics: EngagementMetrics;
  cycleInfo?: {
    name: string;
    year: number;
    status: string;
  };
}

export const PerformanceKPICards = ({ metrics, cycleInfo }: PerformanceKPICardsProps) => {
  const kpis = [
    {
      title: "Ciclo Ativo",
      value: cycleInfo?.name || "2025",
      subtitle: cycleInfo?.status === 'active' ? "Em andamento" : "Não iniciado",
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      title: "Avaliações",
      value: metrics.pendingEvaluations.toString(),
      subtitle: "Pendentes",
      icon: ClipboardCheck,
      color: metrics.pendingEvaluations > 0 ? "text-amber-600" : "text-emerald-600",
      bgColor: metrics.pendingEvaluations > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Metas",
      value: `${metrics.achievedGoals}/${metrics.activeGoals + metrics.achievedGoals}`,
      subtitle: "Atingidas",
      icon: Target,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "PDIs",
      value: metrics.activePdis.toString(),
      subtitle: "Em Andamento",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Kudos",
      value: metrics.kudosThisMonth.toString(),
      subtitle: "Este mês",
      icon: Award,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
    },
    {
      title: "1:1s",
      value: metrics.oneOnOnesThisMonth.toString(),
      subtitle: "Este mês",
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className="border-indigo-200/50 dark:border-indigo-800/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">{kpi.title}</p>
                  <p className="text-xl font-bold mt-0.5">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{kpi.subtitle}</p>
                </div>
                <div className={`p-1.5 rounded-lg ${kpi.bgColor} flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
