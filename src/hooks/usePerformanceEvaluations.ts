import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";

export type PerformanceEvaluation = Tables<"performance_evaluations">;
export type PerformanceEvaluationInsert = TablesInsert<"performance_evaluations">;
export type PerformanceEvaluationUpdate = TablesUpdate<"performance_evaluations">;
export type EvaluationStatus = Enums<"performance_evaluation_status">;
export type EvaluatorType = Enums<"performance_evaluator_type">;

interface EvaluationWithRelations extends PerformanceEvaluation {
  employee?: { full_name: string; avatar_url: string | null; job_title: string | null; grade: string | null } | null;
  evaluator?: { full_name: string; avatar_url: string | null } | null;
  cycle?: { name: string; fiscal_year: number } | null;
  template?: { name: string; template_type: string } | null;
}

interface UseEvaluationsOptions {
  cycleId?: string;
  status?: EvaluationStatus;
  employeeId?: string;
  evaluatorId?: string;
}

export function usePerformanceEvaluations(options: UseEvaluationsOptions = {}) {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const evaluationsQuery = useQuery({
    queryKey: ["performance-evaluations", activeCompanyId, options],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      let query = supabase
        .from("performance_evaluations")
        .select(`
          *,
          employee:profiles!performance_evaluations_employee_id_fkey(full_name, avatar_url, job_title, grade),
          evaluator:profiles!performance_evaluations_evaluator_id_fkey(full_name, avatar_url),
          cycle:performance_cycles!performance_evaluations_cycle_id_fkey(name, fiscal_year),
          template:performance_templates!performance_evaluations_template_id_fkey(name, template_type)
        `)
        .eq("root_company_id", activeCompanyId)
        .order("created_at", { ascending: false });

      if (options.cycleId) {
        query = query.eq("cycle_id", options.cycleId);
      }

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.employeeId) {
        query = query.eq("employee_id", options.employeeId);
      }

      if (options.evaluatorId) {
        query = query.eq("evaluator_id", options.evaluatorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EvaluationWithRelations[];
    },
    enabled: !!activeCompanyId,
  });

  const createEvaluation = useMutation({
    mutationFn: async (evaluation: Omit<PerformanceEvaluationInsert, "root_company_id">) => {
      if (!activeCompanyId) throw new Error("Empresa não selecionada");

      const { data, error } = await supabase
        .from("performance_evaluations")
        .insert({
          ...evaluation,
          root_company_id: activeCompanyId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-evaluations"] });
      toast.success("Avaliação iniciada com sucesso");
    },
    onError: (error) => {
      console.error("Error creating evaluation:", error);
      toast.error("Erro ao criar avaliação");
    },
  });

  const updateEvaluation = useMutation({
    mutationFn: async ({ id, ...updates }: PerformanceEvaluationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("performance_evaluations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-evaluations"] });
      toast.success("Avaliação atualizada com sucesso");
    },
    onError: (error) => {
      console.error("Error updating evaluation:", error);
      toast.error("Erro ao atualizar avaliação");
    },
  });

  const submitForReview = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("performance_evaluations")
        .update({ status: "pending_review" as EvaluationStatus })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-evaluations"] });
      toast.success("Avaliação enviada para revisão");
    },
    onError: (error) => {
      console.error("Error submitting evaluation:", error);
      toast.error("Erro ao enviar avaliação");
    },
  });

  const approveEvaluation = useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("performance_evaluations")
        .update({ 
          status: "approved" as EvaluationStatus,
          approved_at: new Date().toISOString(),
          approved_by: userData.user?.id,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-evaluations"] });
      toast.success("Avaliação aprovada com sucesso");
    },
    onError: (error) => {
      console.error("Error approving evaluation:", error);
      toast.error("Erro ao aprovar avaliação");
    },
  });

  const deleteEvaluation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("performance_evaluations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-evaluations"] });
      toast.success("Avaliação excluída com sucesso");
    },
    onError: (error) => {
      console.error("Error deleting evaluation:", error);
      toast.error("Erro ao excluir avaliação");
    },
  });

  // Get evaluations for 9Box matrix
  const get9BoxData = () => {
    const approved = evaluationsQuery.data?.filter(e => e.status === "approved") ?? [];
    return approved.map(e => ({
      id: e.id,
      employeeId: e.employee_id,
      employeeName: e.employee?.full_name ?? "Sem nome",
      avatarUrl: e.employee?.avatar_url,
      jobTitle: e.employee?.job_title,
      grade: e.employee?.grade,
      performanceScore: e.final_score ?? 0,
      potentialScore: e.potential_score ?? 0,
    }));
  };

  return {
    evaluations: evaluationsQuery.data ?? [],
    isLoading: evaluationsQuery.isLoading,
    error: evaluationsQuery.error,
    refetch: evaluationsQuery.refetch,
    createEvaluation,
    updateEvaluation,
    submitForReview,
    approveEvaluation,
    deleteEvaluation,
    get9BoxData,
  };
}

// Labels
export const evaluationStatusLabels: Record<EvaluationStatus, string> = {
  draft: "Rascunho",
  pending_review: "Aguardando Revisão",
  reviewed: "Revisado",
  approved: "Aprovado",
  returned: "Devolvido",
};

export const evaluationStatusColors: Record<EvaluationStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  pending_review: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  returned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const evaluatorTypeLabels: Record<EvaluatorType, string> = {
  self: "Autoavaliação",
  manager: "Gestor",
  superior: "Superior",
  peer: "Par",
  hr: "RH",
};
