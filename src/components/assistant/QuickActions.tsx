import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export interface QuickAction {
  label: string;
  prompt: string;
  icon: LucideIcon;
  mode?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onActionClick: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickActions = ({ actions, onActionClick, disabled }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="justify-start h-auto py-3 px-4"
            onClick={() => onActionClick(action.prompt)}
            disabled={disabled}
          >
            <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-left text-sm">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
};