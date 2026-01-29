import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, TrendingUp, BookOpen, Users, Briefcase, FileText } from "lucide-react";
import { 
  usePerformancePDI, 
  pdiStatusLabels, 
  pdiStatusColors,
  pdiActionTypeLabels,
  type PerformancePDI,
  type PDIActionItem
} from "@/hooks/usePerformancePDI";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PDICardProps {
  pdi: PerformancePDI & {
    employee?: { full_name: string; avatar_url: string | null; job_title: string | null } | null;
    competency?: { name: string; type: string } | null;
  };
  onEdit: () => void;
}

const actionTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  training: BookOpen,
  mentoring: Users,
  project: Briefcase,
  reading: FileText,
  other: TrendingUp,
};

export function PDICard({ pdi, onEdit }: PDICardProps) {
  const { deletePDI, updateProgress, parseActionItems } = usePerformancePDI();
  const actionItems = parseActionItems(pdi.action_items);
  const progress = pdi.progress_percentage || 0;

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir este PDI?")) {
      await deletePDI.mutateAsync(pdi.id);
    }
  };

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Employee info */}
            {pdi.employee && (
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={pdi.employee.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                    {pdi.employee.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{pdi.employee.full_name}</p>
                  {pdi.employee.job_title && (
                    <p className="text-xs text-muted-foreground">{pdi.employee.job_title}</p>
                  )}
                </div>
              </div>
            )}

            {/* Title and status */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground line-clamp-1 flex-1">
                {pdi.title}
              </h3>
              <Badge variant="outline" className={pdiStatusColors[pdi.status]}>
                {pdiStatusLabels[pdi.status]}
              </Badge>
            </div>

            {pdi.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {pdi.description}
              </p>
            )}

            {/* Progress */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Action items preview */}
            {actionItems.length > 0 && (
              <div className="space-y-1 mb-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {actionItems.length} ação(ões) de desenvolvimento
                </p>
                <div className="flex flex-wrap gap-1">
                  {actionItems.slice(0, 3).map((item) => {
                    const Icon = actionTypeIcons[item.type] || TrendingUp;
                    return (
                      <Badge 
                        key={item.id} 
                        variant="secondary" 
                        className="text-xs gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {pdiActionTypeLabels[item.type]}
                      </Badge>
                    );
                  })}
                  {actionItems.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{actionItems.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Due date */}
            {pdi.due_date && (
              <p className="text-xs text-muted-foreground">
                📅 Prazo: {format(new Date(pdi.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}

            {/* Competency link */}
            {pdi.competency && (
              <Badge variant="outline" className="mt-2 text-xs">
                🎯 {pdi.competency.name}
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
