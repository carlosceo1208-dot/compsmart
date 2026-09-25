import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

const LAST_SEEN_KEY = "leads_last_seen_at";

const getLastSeen = (): string | null => {
  try {
    return localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
};

/** Marca os leads como vistos: zera os contadores vermelhos em toda a UI. */
export const markLeadsAsSeen = () => {
  try {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
  } catch {
    /* storage indisponível */
  }
};

/**
 * Quantidade de leads do site com status "novo" recebidos desde a última
 * vez que o Super Admin abriu a tela de Leads.
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
      let q = supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "novo");
      let q2 = supabase.from("nr1_leads").select("*", { count: "exact", head: true });
      const lastSeen = getLastSeen();
      if (lastSeen) {
        q = q.gt("created_at", lastSeen);
        q2 = q2.gt("created_at", lastSeen);
      }
      const [r1, r2] = await Promise.all([q, q2]);
      if (r1.error) throw r1.error;
      return (r1.count ?? 0) + (r2.error ? 0 : r2.count ?? 0);
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
        .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
          queryClient.invalidateQueries({ queryKey: ["new-leads-count"] });
          queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "nr1_leads" }, () => {
          queryClient.invalidateQueries({ queryKey: ["new-leads-count"] });
          queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
        })
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
