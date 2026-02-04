import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";

export type PerformanceKudos = Tables<"performance_kudos">;
export type PerformanceKudosInsert = TablesInsert<"performance_kudos">;
export type KudosCategory = Enums<"performance_kudos_category">;

export interface KudosWithRelations extends PerformanceKudos {
  from_employee?: { full_name: string; avatar_url: string | null; job_title: string | null } | null;
  to_employee?: { full_name: string; avatar_url: string | null; job_title: string | null } | null;
}

interface UseKudosOptions {
  category?: KudosCategory;
  fromEmployeeId?: string;
  toEmployeeId?: string;
  onlyPublic?: boolean;
}

export function usePerformanceKudos(options: UseKudosOptions = {}) {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const kudosQuery = useQuery({
    queryKey: ["performance-kudos", activeCompanyId, options],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      let query = supabase
        .from("performance_kudos")
        .select(`
          *,
          from_employee:profiles!performance_kudos_from_employee_id_fkey(full_name, avatar_url, job_title),
          to_employee:profiles!performance_kudos_to_employee_id_fkey(full_name, avatar_url, job_title)
        `)
        .eq("root_company_id", activeCompanyId)
        .order("created_at", { ascending: false });

      if (options.category) {
        query = query.eq("category", options.category);
      }

      if (options.fromEmployeeId) {
        query = query.eq("from_employee_id", options.fromEmployeeId);
      }

      if (options.toEmployeeId) {
        query = query.eq("to_employee_id", options.toEmployeeId);
      }

      if (options.onlyPublic) {
        query = query.eq("is_public", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as KudosWithRelations[];
    },
    enabled: !!activeCompanyId,
  });

  const sendKudos = useMutation({
    mutationFn: async (kudos: Omit<PerformanceKudosInsert, "root_company_id" | "from_employee_id">) => {
      if (!activeCompanyId) throw new Error("Empresa não selecionada");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("performance_kudos")
        .insert({
          ...kudos,
          root_company_id: activeCompanyId,
          from_employee_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-kudos"] });
      toast.success("Reconhecimento enviado com sucesso! 🎉");
    },
    onError: (error) => {
      console.error("Error sending kudos:", error);
      toast.error("Erro ao enviar reconhecimento");
    },
  });

  const deleteKudos = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("performance_kudos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-kudos"] });
      toast.success("Reconhecimento removido");
    },
    onError: (error) => {
      console.error("Error deleting kudos:", error);
      toast.error("Erro ao remover reconhecimento");
    },
  });

  // Get current user's received kudos
  const getReceivedKudos = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.id || !activeCompanyId) return [];

    return kudosQuery.data?.filter(k => k.to_employee_id === userData.user?.id) ?? [];
  };

  // Get current user's sent kudos
  const getSentKudos = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.id || !activeCompanyId) return [];

    return kudosQuery.data?.filter(k => k.from_employee_id === userData.user?.id) ?? [];
  };

  return {
    kudos: kudosQuery.data ?? [],
    isLoading: kudosQuery.isLoading,
    error: kudosQuery.error,
    refetch: kudosQuery.refetch,
    sendKudos,
    deleteKudos,
    getReceivedKudos,
    getSentKudos,
  };
}

// Labels and icons for categories
export const kudosCategoryLabels: Record<KudosCategory, string> = {
  teamwork: "Trabalho em Equipe",
  innovation: "Inovação",
  leadership: "Liderança",
  customer_focus: "Foco no Cliente",
  excellence: "Excelência",
};

export const kudosCategoryColors: Record<KudosCategory, string> = {
  teamwork: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  innovation: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  leadership: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  customer_focus: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  excellence: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

export const kudosCategoryEmojis: Record<KudosCategory, string> = {
  teamwork: "🤝",
  innovation: "💡",
  leadership: "🎯",
  customer_focus: "⭐",
  excellence: "🏆",
};
