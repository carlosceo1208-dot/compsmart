import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Target, TrendingUp, MessageSquare, Star } from "lucide-react";
import { PerformanceEmployee } from "@/hooks/usePerformanceEmployees";

interface EmployeeCardProps {
  employee: PerformanceEmployee;
  onClick: () => void;
}

const getEvaluationStatusBadge = (status: string | null) => {
  if (!status) return <Badge variant="outline">Sem avaliação</Badge>;

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Rascunho", variant: "outline" },
    pending: { label: "Pendente", variant: "secondary" },
    in_progress: { label: "Em andamento", variant: "default" },
    completed: { label: "Concluída", variant: "default" },
    approved: { label: "Aprovada", variant: "default" },
    rejected: { label: "Rejeitada", variant: "destructive" },
  };

  const config = statusConfig[status] || { label: status, variant: "outline" as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-indigo-100 dark:border-indigo-900/30"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={employee.avatar_url || undefined} alt={employee.full_name} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700">
              {getInitials(employee.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-foreground truncate">{employee.full_name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {employee.job_title || "Sem cargo"}
                </p>
                {employee.grade && (
                  <span className="text-xs text-muted-foreground">Grade: {employee.grade}</span>
                )}
              </div>
              {getEvaluationStatusBadge(employee.last_evaluation_status)}
            </div>

            {employee.unit_breadcrumb && (
              <p className="text-xs text-muted-foreground mt-1 truncate" title={employee.unit_breadcrumb}>
                📍 {employee.unit_breadcrumb}
              </p>
            )}

            {/* Indicadores de Performance */}
            <div className="flex items-center gap-3 mt-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-sm">
                      <Target className="h-4 w-4 text-indigo-500" />
                      <span className="font-medium">{employee.active_goals_count}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Metas ativas</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">{employee.active_pdi_count}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>PDIs ativos</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {employee.pending_feedback_count > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm">
                        <MessageSquare className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{employee.pending_feedback_count}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Feedbacks 360 pendentes</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {employee.last_evaluation_score && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{employee.last_evaluation_score.toFixed(1)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Nota última avaliação</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
