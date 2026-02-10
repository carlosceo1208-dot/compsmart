import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, Award, Target, FileText, MessageSquare, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "kudos" | "goal" | "pdi" | "evaluation" | "one_on_one";
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

const activityIcons = {
  kudos: { icon: Award, color: "text-pink-500 bg-pink-100 dark:bg-pink-900/30" },
  goal: { icon: Target, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" },
  pdi: { icon: FileText, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
  evaluation: { icon: CheckCircle, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
  one_on_one: { icon: MessageSquare, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
};

export const RecentActivityCard = () => {
  const { activeCompanyId } = useCompanyContext();

  const { data: activities = [] } = useQuery({
    queryKey: ['recent-performance-activity', activeCompanyId],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!activeCompanyId) return [];

      const results: ActivityItem[] = [];
      const limit = 3;

      // Fetch recent kudos
      const { data: kudos } = await supabase
        .from('performance_kudos')
        .select(`
          id, message, category, created_at,
          sender:profiles!performance_kudos_sender_id_fkey(full_name, avatar_url),
          receiver:profiles!performance_kudos_receiver_id_fkey(full_name)
        `)
        .eq('root_company_id', activeCompanyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      kudos?.forEach((k: any) => {
        results.push({
          id: k.id,
          type: "kudos",
          title: `Reconhecimento enviado`,
          description: `${k.sender?.full_name} → ${k.receiver?.full_name}`,
          timestamp: k.created_at,
          user: { name: k.sender?.full_name, avatar: k.sender?.avatar_url },
        });
      });

      // Fetch recent goals achieved
      const { data: goals } = await supabase
        .from('performance_goals')
        .select(`
          id, title, status, updated_at,
          employee:profiles!performance_goals_employee_id_fkey(full_name, avatar_url)
        `)
        .eq('root_company_id', activeCompanyId)
        .eq('status', 'achieved')
        .order('updated_at', { ascending: false })
        .limit(limit);

      goals?.forEach((g: any) => {
        results.push({
          id: g.id,
          type: "goal",
          title: `Meta atingida`,
          description: g.title,
          timestamp: g.updated_at,
          user: { name: g.employee?.full_name, avatar: g.employee?.avatar_url },
        });
      });

      // Sort by timestamp and take top 5
      return results
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    },
    enabled: !!activeCompanyId,
  });

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => {
              const config = activityIcons[activity.type];
              const Icon = config.icon;
              const initials = activity.user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "?";

              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user?.avatar} />
                    <AvatarFallback className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${config.color}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium truncate">{activity.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Activity className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhuma atividade recente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
