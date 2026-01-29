import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate, Enums, Json } from "@/integrations/supabase/types";

export type PerformancePDI = Tables<"performance_pdi">;
export type PerformancePDIInsert = TablesInsert<"performance_pdi">;
export type PerformancePDIUpdate = TablesUpdate<"performance_pdi">;
export type PDIStatus = Enums<"performance_pdi_status">;

export interface PDIActionItem {
  id: string;
  text: string;
  type: "training" | "mentoring" | "project" | "reading" | "other";
  dueDate?: string;
  completed?: boolean;
}

export interface PDIWithRelations extends PerformancePDI {
  employee?: { full_name: string; avatar_url: string | null; job_title: string | null } | null;
  competency?: { name: string; type: string } | null;
  evaluation?: { final_score: number | null; cycle_id: string } | null;
}

interface UsePDIOptions {
  employeeId?: string;
  status?: PDIStatus;
  evaluationId?: string;
  competencyId?: string;
}

export function usePerformancePDI(options: UsePDIOptions = {}) {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const pdiQuery = useQuery({
    queryKey: ["performance-pdi", activeCompanyId, options],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      let query = supabase
        .from("performance_pdi")
        .select(`
          *,
          employee:profiles!performance_pdi_employee_id_fkey(full_name, avatar_url, job_title),
          competency:competencies!performance_pdi_competency_id_fkey(name, type),
          evaluation:performance_evaluations!performance_pdi_evaluation_id_fkey(final_score, cycle_id)
        `)
        .eq("root_company_id", activeCompanyId)
        .order("created_at", { ascending: false });

      if (options.employeeId) {
        query = query.eq("employee_id", options.employeeId);
      }

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.evaluationId) {
        query = query.eq("evaluation_id", options.evaluationId);
      }

      if (options.competencyId) {
        query = query.eq("competency_id", options.competencyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PDIWithRelations[];
    },
    enabled: !!activeCompanyId,
  });

  const createPDI = useMutation({
    mutationFn: async (pdi: Omit<PerformancePDIInsert, "root_company_id">) => {
      if (!activeCompanyId) throw new Error("Empresa não selecionada");

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("performance_pdi")
        .insert({
          ...pdi,
          root_company_id: activeCompanyId,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-pdi"] });
      toast.success("PDI criado com sucesso");
    },
    onError: (error) => {
      console.error("Error creating PDI:", error);
      toast.error("Erro ao criar PDI");
    },
  });

  const updatePDI = useMutation({
    mutationFn: async ({ id, ...updates }: PerformancePDIUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("performance_pdi")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-pdi"] });
      toast.success("PDI atualizado com sucesso");
    },
    onError: (error) => {
      console.error("Error updating PDI:", error);
      toast.error("Erro ao atualizar PDI");
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const status: PDIStatus = progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "pending";
      
      const { data, error } = await supabase
        .from("performance_pdi")
        .update({ 
          progress_percentage: progress,
          status,
          completed_at: progress >= 100 ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-pdi"] });
      toast.success("Progresso atualizado");
    },
    onError: (error) => {
      console.error("Error updating progress:", error);
      toast.error("Erro ao atualizar progresso");
    },
  });

  const deletePDI = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("performance_pdi")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-pdi"] });
      toast.success("PDI excluído com sucesso");
    },
    onError: (error) => {
      console.error("Error deleting PDI:", error);
      toast.error("Erro ao excluir PDI");
    },
  });

  // Parse action items from JSON
  const parseActionItems = (items: Json | null): PDIActionItem[] => {
    if (!items || !Array.isArray(items)) return [];
    return items as unknown as PDIActionItem[];
  };

  return {
    pdis: pdiQuery.data ?? [],
    isLoading: pdiQuery.isLoading,
    error: pdiQuery.error,
    refetch: pdiQuery.refetch,
    createPDI,
    updatePDI,
    updateProgress,
    deletePDI,
    parseActionItems,
  };
}

// Labels for status
export const pdiStatusLabels: Record<PDIStatus, string> = {
  pending: "Pendente",
  in_progress: "Em Progresso",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const pdiStatusColors: Record<PDIStatus, string> = {
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const pdiActionTypeLabels: Record<string, string> = {
  training: "Treinamento",
  mentoring: "Mentoria",
  project: "Projeto",
  reading: "Leitura",
  other: "Outro",
};
