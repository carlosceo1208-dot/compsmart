import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  questionText: string;
  priority: number;
}

interface QuickActionsPanelProps {
  actions: QuickAction[];
  onActionClick: (question: string) => void;
  compact?: boolean;
}

export const QuickActionsPanel = ({ 
  actions, 
  onActionClick,
  compact = false 
}: QuickActionsPanelProps) => {
  if (actions.length === 0) return null;

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      {!compact && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>Perguntas rápidas:</span>
        </div>
      )}
      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-1")}>
        {actions.slice(0, compact ? 4 : 6).map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left h-auto whitespace-normal",
              compact ? "text-xs px-2 py-1.5" : "text-sm py-2 px-3"
            )}
            onClick={() => onActionClick(action.questionText)}
          >
            {action.questionText}
          </Button>
        ))}
      </div>
    </div>
  );
};