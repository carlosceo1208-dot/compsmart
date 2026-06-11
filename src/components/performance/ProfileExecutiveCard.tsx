import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target, FileText, CheckSquare, Calendar, Award } from "lucide-react";
import { Link } from "react-router-dom";

interface ProfileExecutiveCardProps {
  user: {
    full_name: string;
    job_title?: string | null;
    avatar_url?: string | null;
    department?: string | null;
  } | null;
  stats?: {
    pendingEvaluations: number;
    activeGoals: number;
    activePdis: number;
  };
}

const quickActions = [
  { label: "Metas", icon: Target, href: "/performance/goals", color: "text-emerald-600" },
  { label: "1:1s", icon: Calendar, href: "/performance/one-on-ones", color: "text-blue-600" },
  { label: "PDIs", icon: FileText, href: "/performance/pdi", color: "text-amber-600" },
  { label: "Avaliar", icon: CheckSquare, href: "/performance/evaluations", color: "text-purple-600" },
  { label: "Reconhecimento", icon: Award, href: "/performance/kudos", color: "text-pink-600" },
];

export const ProfileExecutiveCard = ({ user, stats }: ProfileExecutiveCardProps) => {
  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/30 dark:to-purple-950/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 border-2 border-indigo-200 dark:border-indigo-700 shadow-lg">
            <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || "Usuário"} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-indigo-900 dark:text-indigo-100 truncate">
              {user?.full_name || "Carregando..."}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {user?.job_title || "Sem cargo definido"}
            </p>
            {user?.department && (
              <p className="text-xs text-muted-foreground truncate">{user.department}</p>
            )}
            
            {/* Quick Stats */}
            {stats && (
              <div className="flex gap-3 mt-2">
                {stats.pendingEvaluations > 0 && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    {stats.pendingEvaluations} avaliação{stats.pendingEvaluations > 1 ? "ões" : ""} pendente{stats.pendingEvaluations > 1 ? "s" : ""}
                  </span>
                )}
                {stats.activeGoals > 0 && (
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    {stats.activeGoals} meta{stats.activeGoals > 1 ? "s" : ""} ativa{stats.activeGoals > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-white/80 dark:bg-background/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-indigo-200/50 dark:border-indigo-700/50"
                >
                  <Icon className={`h-3.5 w-3.5 mr-1.5 ${action.color}`} />
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
