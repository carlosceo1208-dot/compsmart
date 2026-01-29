import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { 
  kudosCategoryLabels, 
  kudosCategoryColors,
  kudosCategoryEmojis,
  usePerformanceKudos,
  type KudosCategory
} from "@/hooks/usePerformanceKudos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

interface KudosCardProps {
  kudos: Tables<"performance_kudos"> & {
    from_employee?: { full_name: string; avatar_url: string | null; job_title: string | null } | null;
    to_employee?: { full_name: string; avatar_url: string | null; job_title: string | null } | null;
  };
  currentUserId?: string;
}

export function KudosCard({ kudos, currentUserId }: KudosCardProps) {
  const { deleteKudos } = usePerformanceKudos();
  
  const canDelete = currentUserId === kudos.from_employee_id;

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja remover este kudos?")) {
      await deleteKudos.mutateAsync(kudos.id);
    }
  };

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* From avatar */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={kudos.from_employee?.avatar_url || undefined} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {kudos.from_employee?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm">
                  <span className="font-medium">{kudos.from_employee?.full_name || "Alguém"}</span>
                  <span className="text-muted-foreground"> reconheceu </span>
                  <span className="font-medium">{kudos.to_employee?.full_name || "alguém"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(kudos.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-500"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Category badge */}
            <div className="mt-2">
              <Badge 
                variant="outline" 
                className={kudosCategoryColors[kudos.category as KudosCategory]}
              >
                {kudosCategoryEmojis[kudos.category as KudosCategory]} {kudosCategoryLabels[kudos.category as KudosCategory]}
              </Badge>
              {!kudos.is_public && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Privado
                </Badge>
              )}
            </div>

            {/* Message */}
            <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">
              "{kudos.message}"
            </p>

            {/* To employee card */}
            {kudos.to_employee && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={kudos.to_employee.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {kudos.to_employee.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{kudos.to_employee.full_name}</p>
                  {kudos.to_employee.job_title && (
                    <p className="text-xs text-muted-foreground">{kudos.to_employee.job_title}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
