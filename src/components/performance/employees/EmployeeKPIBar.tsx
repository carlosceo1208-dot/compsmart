import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, TrendingUp, ClipboardCheck, MessageSquare } from "lucide-react";

interface KPIData {
  totalEmployees: number;
  withActiveGoals: number;
  withActivePDI: number;
  pendingEvaluation: number;
  completedEvaluation: number;
  pendingFeedback: number;
}

interface EmployeeKPIBarProps {
  kpis: KPIData;
  isLoading?: boolean;
}

export function EmployeeKPIBar({ kpis, isLoading }: EmployeeKPIBarProps) {
  const kpiItems = [
    {
      label: "Colaboradores",
      value: kpis.totalEmployees,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      label: "Com Metas",
      value: kpis.withActiveGoals,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Com PDI",
      value: kpis.withActivePDI,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Avaliações Pendentes",
      value: kpis.pendingEvaluation,
      icon: ClipboardCheck,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Feedback 360",
      value: kpis.pendingFeedback,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpiItems.map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {kpiItems.map((item) => (
        <Card key={item.label} className="border-indigo-100 dark:border-indigo-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
