import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";

export type PerformanceGoal = Tables<"performance_goals">;
export type PerformanceGoalInsert = TablesInsert<"performance_goals">;
export type PerformanceGoalUpdate = TablesUpdate<"performance_goals">;
export type GoalLevel = Enums<"performance_goal_level">;
export type GoalStatus = Enums<"performance_goal_status">;

export interface GoalWithRelations extends PerformanceGoal {
  employee?: { full_name: string; avatar_url: string | null } | null;
  unit?: { description: string; code: string } | null;
  cycle?: { name: string } | null;
}

interface UseGoalsOptions {
  cycleId?: string;
  level?: GoalLevel;
  status?: GoalStatus;
  employeeId?: string;
  parentGoalId?: string | null;
}

export function usePerformanceGoals(options: UseGoalsOptions = {}) {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: ["performance-goals", activeCompanyId, options],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      let query = supabase
        .from("performance_goals")
        .select(`
          *,
          employee:profiles!performance_goals_employee_id_fkey(full_name, avatar_url),
          unit:organizational_structure!performance_goals_unit_id_fkey(description, code),
          cycle:performance_cycles!performance_goals_cycle_id_fkey(name)
        `)
        .eq("root_company_id", activeCompanyId)
        .order("level")
        .order("created_at", { ascending: false });

      if (options.cycleId) {
        query = query.eq("cycle_id", options.cycleId);
      }

      if (options.level) {
        query = query.eq("level", options.level);
      }

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.employeeId) {
        query = query.eq("employee_id", options.employeeId);
      }

      if (options.parentGoalId !== undefined) {
        if (options.parentGoalId === null) {
          query = query.is("parent_goal_id", null);
        } else {
          query = query.eq("parent_goal_id", options.parentGoalId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as GoalWithRelations[];
    },
    enabled: !!activeCompanyId,
  });

  const createGoal = useMutation({
    mutationFn: async (goal: Omit<PerformanceGoalInsert, "root_company_id">) => {
      if (!activeCompanyId) throw new Error("Empresa não selecionada");

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("performance_goals")
        .insert({
          ...goal,
          root_company_id: activeCompanyId,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-goals"] });
      toast.success("Meta criada com sucesso");
    },
    onError: (error) => {
      console.error("Error creating goal:", error);
      toast.error("Erro ao criar meta");
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: PerformanceGoalUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("performance_goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-goals"] });
      toast.success("Meta atualizada com sucesso");
    },
    onError: (error) => {
      console.error("Error updating goal:", error);
      toast.error("Erro ao atualizar meta");
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: number }) => {
      const { data, error } = await supabase
        .from("performance_goals")
        .update({ 
          current_value: currentValue,
          status: "in_progress" as GoalStatus
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-goals"] });
      toast.success("Progresso atualizado");
    },
    onError: (error) => {
      console.error("Error updating progress:", error);
      toast.error("Erro ao atualizar progresso");
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("performance_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-goals"] });
      toast.success("Meta excluída com sucesso");
    },
    onError: (error) => {
      console.error("Error deleting goal:", error);
      toast.error("Erro ao excluir meta");
    },
  });

  // Calculate progress percentage
  const calculateProgress = (goal: PerformanceGoal): number => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    const current = goal.current_value || 0;
    return Math.min(100, Math.round((current / goal.target_value) * 100));
  };

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    error: goalsQuery.error,
    refetch: goalsQuery.refetch,
    createGoal,
    updateGoal,
    updateProgress,
    deleteGoal,
    calculateProgress,
  };
}

// Labels for levels and status
export const goalLevelLabels: Record<GoalLevel, string> = {
  company: "Empresa",
  area: "Área",
  department: "Departamento",
  position: "Cargo",
  individual: "Individual",
};

export const goalLevelColors: Record<GoalLevel, string> = {
  company: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  area: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  department: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  position: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  individual: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

export const goalStatusLabels: Record<GoalStatus, string> = {
  pending: "Pendente",
  in_progress: "Em Progresso",
  achieved: "Atingida",
  not_achieved: "Não Atingida",
};

export const goalStatusColors: Record<GoalStatus, string> = {
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  achieved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  not_achieved: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};
