import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";

export type PerformanceSuccession = Tables<"performance_succession">;
export type PerformanceSuccessionInsert = TablesInsert<"performance_succession">;
export type PerformanceSuccessionUpdate = TablesUpdate<"performance_succession">;
export type Readiness = Enums<"performance_readiness">;

export interface SuccessionWithRelations extends PerformanceSuccession {
  key_position?: { title: string; grade: string; code: string } | null;
  successor?: { full_name: string; avatar_url: string | null; job_title: string | null; grade: string | null } | null;
  created_by_user?: { full_name: string } | null;
  approved_by_user?: { full_name: string } | null;
}

interface UseSuccessionOptions {
  keyPositionId?: string;
  successorEmployeeId?: string;
  readiness?: Readiness;
}

export function usePerformanceSuccession(options: UseSuccessionOptions = {}) {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const successionQuery = useQuery({
    queryKey: ["performance-succession", activeCompanyId, options],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      let query = supabase
        .from("performance_succession")
        .select(`
          *,
          key_position:job_titles!performance_succession_key_position_id_fkey(title, grade, code),
          successor:profiles!performance_succession_successor_employee_id_fkey(full_name, avatar_url, job_title, grade),
          created_by_user:profiles!performance_succession_created_by_fkey(full_name),
          approved_by_user:profiles!performance_succession_approved_by_fkey(full_name)
        `)
        .eq("root_company_id", activeCompanyId)
        .order("key_position_id")
        .order("rank", { ascending: true });

      if (options.keyPositionId) {
        query = query.eq("key_position_id", options.keyPositionId);
      }

      if (options.successorEmployeeId) {
        query = query.eq("successor_employee_id", options.successorEmployeeId);
      }

      if (options.readiness) {
        query = query.eq("readiness", options.readiness);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SuccessionWithRelations[];
    },
    enabled: !!activeCompanyId,
  });

  const createSuccession = useMutation({
    mutationFn: async (succession: Omit<PerformanceSuccessionInsert, "root_company_id">) => {
      if (!activeCompanyId) throw new Error("Empresa não selecionada");

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("performance_succession")
        .insert({
          ...succession,
          root_company_id: activeCompanyId,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-succession"] });
      toast.success("Mapeamento de sucessão criado");
    },
    onError: (error) => {
      console.error("Error creating succession:", error);
      toast.error("Erro ao criar mapeamento");
    },
  });

  const updateSuccession = useMutation({
    mutationFn: async ({ id, ...updates }: PerformanceSuccessionUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("performance_succession")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-succession"] });
      toast.success("Mapeamento atualizado");
    },
    onError: (error) => {
      console.error("Error updating succession:", error);
      toast.error("Erro ao atualizar mapeamento");
    },
  });

  const deleteSuccession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("performance_succession")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-succession"] });
      toast.success("Mapeamento removido");
    },
    onError: (error) => {
      console.error("Error deleting succession:", error);
      toast.error("Erro ao remover mapeamento");
    },
  });

  // Group successions by key position
  const getSuccessionsByPosition = () => {
    const grouped = new Map<string, SuccessionWithRelations[]>();
    
    successionQuery.data?.forEach(s => {
      const positionId = s.key_position_id;
      if (!grouped.has(positionId)) {
        grouped.set(positionId, []);
      }
      grouped.get(positionId)!.push(s);
    });

    return grouped;
  };

  return {
    successions: successionQuery.data ?? [],
    isLoading: successionQuery.isLoading,
    error: successionQuery.error,
    refetch: successionQuery.refetch,
    createSuccession,
    updateSuccession,
    deleteSuccession,
    getSuccessionsByPosition,
  };
}

// Labels for readiness
export const readinessLabels: Record<Readiness, string> = {
  ready_now: "Pronto Agora",
  ready_1_year: "Pronto em 1 Ano",
  ready_2_years: "Pronto em 2 Anos",
  development: "Em Desenvolvimento",
};

export const readinessColors: Record<Readiness, string> = {
  ready_now: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ready_1_year: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ready_2_years: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  development: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const readinessOrder: Readiness[] = ["ready_now", "ready_1_year", "ready_2_years", "development"];

// Ranking labels and icons
export const rankLabels: Record<number, string> = {
  1: "1º - Primeiro na Linha",
  2: "2º - Segunda Opção",
  3: "3º - Terceira Opção",
};

export const rankIcons: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};
