import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

/**
 * Quantidade de leads do site com status "novo".
 * Somente super admin consegue ler a tabela leads (RLS), por isso o hook
 * fica desabilitado para os demais papéis.
 */
export const useNewLeadsCount = () => {
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();
  const isSuperAdmin = !!roleData?.isSuperAdmin;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["new-leads-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "novo");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isSuperAdmin && !roleLoading,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!isSuperAdmin) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      const name = `new-leads-count-${Math.random().toString(36).slice(2)}`;
      channel = supabase
        .channel(name)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "leads" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["new-leads-count"] });
            queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Realtime de leads indisponível; usando polling.", e);
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [isSuperAdmin, queryClient]);

  return {
    isSuperAdmin,
    newLeads: query.data ?? 0,
    isLoading: query.isLoading,
  };
};
