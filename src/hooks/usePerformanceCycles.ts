import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";

export type PerformanceCycle = Tables<"performance_cycles">;
export type PerformanceCycleInsert = TablesInsert<"performance_cycles">;
export type PerformanceCycleUpdate = TablesUpdate<"performance_cycles">;
export type CycleStatus = Enums<"performance_cycle_status">;
export type EvaluationAngle = Enums<"performance_evaluation_angle">;
export type ScaleType = Enums<"performance_scale_type">;

interface UseCyclesOptions {
  fiscalYear?: number;
  status?: CycleStatus;
  includeInactive?: boolean;
}

export function usePerformanceCycles(options: UseCyclesOptions = {}) {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const cyclesQuery = useQuery({
    queryKey: ["performance-cycles", activeCompanyId, options],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      let query = supabase
        .from("performance_cycles")
        .select("*")
        .eq("root_company_id", activeCompanyId)
        .order("fiscal_year", { ascending: false })
        .order("created_at", { ascending: false });

      if (options.fiscalYear) {
        query = query.eq("fiscal_year", options.fiscalYear);
      }

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (!options.includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PerformanceCycle[];
    },
    enabled: !!activeCompanyId,
  });

  const createCycle = useMutation({
    mutationFn: async (cycle: Omit<PerformanceCycleInsert, "root_company_id">) => {
      if (!activeCompanyId) throw new Error("Empresa não selecionada");

      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("performance_cycles")
        .insert({
          ...cycle,
          root_company_id: activeCompanyId,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-cycles"] });
      toast.success("Ciclo criado com sucesso");
    },
    onError: (error) => {
      console.error("Error creating cycle:", error);
      toast.error("Erro ao criar ciclo");
    },
  });

  const updateCycle = useMutation({
    mutationFn: async ({ id, ...updates }: PerformanceCycleUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("performance_cycles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-cycles"] });
      toast.success("Ciclo atualizado com sucesso");
    },
    onError: (error) => {
      console.error("Error updating cycle:", error);
      toast.error("Erro ao atualizar ciclo");
    },
  });

  const deleteCycle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("performance_cycles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-cycles"] });
      toast.success("Ciclo excluído com sucesso");
    },
    onError: (error) => {
      console.error("Error deleting cycle:", error);
      toast.error("Erro ao excluir ciclo");
    },
  });

  return {
    cycles: cyclesQuery.data ?? [],
    isLoading: cyclesQuery.isLoading,
    error: cyclesQuery.error,
    refetch: cyclesQuery.refetch,
    createCycle,
    updateCycle,
    deleteCycle,
  };
}

// Helper to get status label in Portuguese
export const cycleStatusLabels: Record<CycleStatus, string> = {
  draft: "Rascunho",
  goals: "Definição de Metas",
  monitoring: "Acompanhamento",
  insights: "Análises",
  closing: "Encerramento",
  closed: "Encerrado",
};

// Helper to get status color
export const cycleStatusColors: Record<CycleStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  goals: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  monitoring: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  insights: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  closing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  closed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

// Helper to get evaluation angle label
export const evaluationAngleLabels: Record<EvaluationAngle, string> = {
  "90": "90° - Autoavaliação + Gestor",
  "180": "180° - Autoavaliação + Gestor + Pares",
  "360": "360° - Feedback 360 Completo",
};

// Helper to get scale type label
export const scaleTypeLabels: Record<ScaleType, string> = {
  numeric_1_5: "Numérica (1-5)",
  conceptual: "Conceitual (A-E)",
  percentage: "Percentual (0-100%)",
};
