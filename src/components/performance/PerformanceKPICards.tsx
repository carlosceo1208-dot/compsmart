import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  ClipboardCheck, 
  FileText, 
  Award,
  Calendar,
  TrendingUp,
  MessageSquare,
  Users,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import type { EngagementMetrics } from "@/hooks/useEngagementMetrics";
import { Link } from "react-router-dom";

interface PerformanceKPICardsProps {
  metrics: EngagementMetrics;
  cycleInfo?: {
    name: string;
    year: number;
    status: string;
  };
}

export const PerformanceKPICards = ({ metrics, cycleInfo }: PerformanceKPICardsProps) => {
  const totalGoals = metrics.activeGoals + metrics.achievedGoals;
  const goalPercentage = totalGoals > 0 ? Math.round((metrics.achievedGoals / totalGoals) * 100) : 0;
  
  const kpis = [
    {
      title: "Ciclo Ativo",
      value: cycleInfo?.name || "2025",
      subtitle: cycleInfo?.status === 'active' ? "Em andamento" : "Não iniciado",
      icon: Calendar,
      color: "from-indigo-500 to-indigo-600",
      textColor: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/20",
      trend: null,
      link: "/performance/cycles",
    },
    {
      title: "Avaliações",
      value: metrics.pendingEvaluations.toString(),
      subtitle: "Pendentes",
      icon: ClipboardCheck,
      color: metrics.pendingEvaluations > 0 ? "from-amber-500 to-orange-500" : "from-emerald-500 to-emerald-600",
      textColor: metrics.pendingEvaluations > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
      bgColor: metrics.pendingEvaluations > 0 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-900/20" 
        : "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20",
      trend: metrics.pendingEvaluations > 0 ? "warning" : "positive",
      link: "/performance/evaluations",
    },
    {
      title: "Metas",
      value: `${metrics.achievedGoals}/${totalGoals}`,
      subtitle: `${goalPercentage}% atingidas`,
      icon: Target,
      color: "from-emerald-500 to-teal-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-900/20",
      trend: goalPercentage >= 70 ? "positive" : goalPercentage >= 40 ? "neutral" : "warning",
      link: "/performance/goals",
    },
    {
      title: "PDIs",
      value: metrics.activePdis.toString(),
      subtitle: `${metrics.completedPdis} concluídos`,
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-900/20",
      trend: null,
      link: "/performance/pdi",
    },
    {
      title: "Kudos",
      value: metrics.kudosThisMonth.toString(),
      subtitle: "Este mês",
      icon: Award,
      color: "from-pink-500 to-rose-500",
      textColor: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-900/20",
      trend: metrics.kudosThisMonth > 0 ? "positive" : null,
      link: "/performance/kudos",
    },
    {
      title: "1:1s",
      value: metrics.oneOnOnesThisMonth.toString(),
      subtitle: "Este mês",
      icon: MessageSquare,
      color: "from-violet-500 to-purple-500",
      textColor: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-900/20",
      trend: metrics.oneOnOnesThisMonth > 0 ? "positive" : null,
      link: "/performance/one-on-ones",
    },
  ];

  const getTrendIcon = (trend: string | null) => {
    if (trend === "positive") return <ArrowUp className="h-3 w-3 text-emerald-500" />;
    if (trend === "warning") return <ArrowDown className="h-3 w-3 text-amber-500" />;
    if (trend === "neutral") return <Minus className="h-3 w-3 text-slate-400" />;
    return null;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Link key={kpi.title} to={kpi.link}>
            <Card className={`${kpi.bgColor} border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group`}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      {kpi.title}
                      {getTrendIcon(kpi.trend)}
                    </p>
                    <p className={`text-xl font-bold mt-0.5 ${kpi.textColor}`}>{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{kpi.subtitle}</p>
                  </div>
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${kpi.color} flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};
