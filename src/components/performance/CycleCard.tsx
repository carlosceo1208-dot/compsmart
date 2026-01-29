import { Calendar, Edit2, MoreVertical, Target, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  type PerformanceCycle,
  cycleStatusLabels,
  cycleStatusColors,
  evaluationAngleLabels,
} from "@/hooks/usePerformanceCycles";
import { formatDateBRFromISODate } from "@/lib/date";

interface CycleCardProps {
  cycle: PerformanceCycle;
  onEdit: (cycle: PerformanceCycle) => void;
  onDelete: (cycle: PerformanceCycle) => void;
  onClick?: (cycle: PerformanceCycle) => void;
}

const statusOrder = ["draft", "goals", "monitoring", "insights", "closing", "closed"];

export function CycleCard({ cycle, onEdit, onDelete, onClick }: CycleCardProps) {
  const currentStatusIndex = statusOrder.indexOf(cycle.status);
  const progressPercentage = ((currentStatusIndex + 1) / statusOrder.length) * 100;

  return (
    <Card
      className="border-indigo-200/50 dark:border-indigo-800/30 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(cycle)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-indigo-900 dark:text-indigo-100">
              {cycle.name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge className={cycleStatusColors[cycle.status]}>
                {cycleStatusLabels[cycle.status]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Ano Fiscal {cycle.fiscal_year}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(cycle);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(cycle);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {cycle.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {cycle.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso do Ciclo</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs">
            {statusOrder.map((status, idx) => (
              <div
                key={status}
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  idx <= currentStatusIndex
                    ? "bg-indigo-600 text-white"
                    : "bg-muted"
                }`}
              >
                {idx < currentStatusIndex && (
                  <span className="text-[8px]">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDateBRFromISODate(cycle.start_date)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {cycle.goals_weight ?? 70}% Metas
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {evaluationAngleLabels[cycle.evaluation_angle].split(" ")[0]}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
