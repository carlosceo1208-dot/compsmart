import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Pencil, 
  Trash2, 
  TrendingUp,
  Building2,
  Users,
  Briefcase,
  User
} from "lucide-react";
import { 
  usePerformanceGoals, 
  goalLevelLabels, 
  goalLevelColors,
  goalStatusLabels,
  goalStatusColors,
  type PerformanceGoal,
  type GoalLevel
} from "@/hooks/usePerformanceGoals";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GoalCardProps {
  goal: PerformanceGoal & {
    employee?: { full_name: string; avatar_url: string | null } | null;
    unit?: { description: string; code: string } | null;
    cycle?: { name: string } | null;
  };
  onEdit: () => void;
  onUpdateProgress: () => void;
}

const levelIcons: Record<GoalLevel, React.ComponentType<{ className?: string }>> = {
  company: Building2,
  area: Users,
  department: Users,
  position: Briefcase,
  individual: User,
};

export function GoalCard({ goal, onEdit, onUpdateProgress }: GoalCardProps) {
  const { deleteGoal, calculateProgress } = usePerformanceGoals();
  const progress = calculateProgress(goal);
  const LevelIcon = levelIcons[goal.level];

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir esta meta?")) {
      await deleteGoal.mutateAsync(goal.id);
    }
  };

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
                <LevelIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <Badge variant="outline" className={goalLevelColors[goal.level]}>
                {goalLevelLabels[goal.level]}
              </Badge>
              <Badge variant="outline" className={goalStatusColors[goal.status]}>
                {goalStatusLabels[goal.status]}
              </Badge>
            </div>

            <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
              {goal.title}
            </h3>

            {goal.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {goal.description}
              </p>
            )}

            {/* Owner info */}
            {goal.level === "individual" && goal.employee && (
              <p className="text-xs text-muted-foreground mb-2">
                👤 {goal.employee.full_name}
              </p>
            )}
            {["area", "department"].includes(goal.level) && goal.unit && (
              <p className="text-xs text-muted-foreground mb-2">
                🏢 {goal.unit.code} - {goal.unit.description}
              </p>
            )}

            {/* Progress */}
            {goal.target_value && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">
                    {goal.current_value ?? 0} / {goal.target_value} {goal.unit_of_measure || ""}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-right text-xs text-muted-foreground">
                  {progress}%
                </div>
              </div>
            )}

            {/* Footer info */}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              {goal.due_date && (
                <span>
                  📅 {format(new Date(goal.due_date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
              {goal.weight && (
                <span>⚖️ Peso: {goal.weight}%</span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onUpdateProgress}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Atualizar Progresso
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
