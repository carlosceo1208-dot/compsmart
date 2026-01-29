import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate, Json } from "@/integrations/supabase/types";

export type PerformanceOneOnOne = Tables<"performance_one_on_ones">;
export type PerformanceOneOnOneInsert = TablesInsert<"performance_one_on_ones">;
export type PerformanceOneOnOneUpdate = TablesUpdate<"performance_one_on_ones">;

export interface AgendaItem {
  id: string;
  text: string;
  completed?: boolean;
}

export interface ActionItem {
  id: string;
  text: string;
  responsible: string;
  dueDate?: string;
  completed?: boolean;
}

export interface OneOnOneWithRelations extends PerformanceOneOnOne {
  employee?: { full_name: string; avatar_url: string | null; job_title: string | null } | null;
  manager?: { full_name: string; avatar_url: string | null } | null;
}

interface UseOneOnOnesOptions {
  employeeId?: string;
  managerId?: string;
  isCompleted?: boolean;
  fromDate?: string;
  toDate?: string;
}

export function usePerformanceOneOnOnes(options: UseOneOnOnesOptions = {}) {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const oneOnOnesQuery = useQuery({
    queryKey: ["performance-one-on-ones", activeCompanyId, options],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      let query = supabase
        .from("performance_one_on_ones")
        .select(`
          *,
          employee:profiles!performance_one_on_ones_employee_id_fkey(full_name, avatar_url, job_title),
          manager:profiles!performance_one_on_ones_manager_id_fkey(full_name, avatar_url)
        `)
        .eq("root_company_id", activeCompanyId)
        .order("scheduled_date", { ascending: false });

      if (options.employeeId) {
        query = query.eq("employee_id", options.employeeId);
      }

      if (options.managerId) {
        query = query.eq("manager_id", options.managerId);
      }

      if (options.isCompleted !== undefined) {
        query = query.eq("is_completed", options.isCompleted);
      }

      if (options.fromDate) {
        query = query.gte("scheduled_date", options.fromDate);
      }

      if (options.toDate) {
        query = query.lte("scheduled_date", options.toDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as OneOnOneWithRelations[];
    },
    enabled: !!activeCompanyId,
  });

  const createOneOnOne = useMutation({
    mutationFn: async (oneOnOne: Omit<PerformanceOneOnOneInsert, "root_company_id" | "manager_id">) => {
      if (!activeCompanyId) throw new Error("Empresa não selecionada");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("performance_one_on_ones")
        .insert({
          ...oneOnOne,
          root_company_id: activeCompanyId,
          manager_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-one-on-ones"] });
      toast.success("Reunião 1:1 agendada com sucesso");
    },
    onError: (error) => {
      console.error("Error creating 1:1:", error);
      toast.error("Erro ao agendar reunião");
    },
  });

  const updateOneOnOne = useMutation({
    mutationFn: async ({ id, ...updates }: PerformanceOneOnOneUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("performance_one_on_ones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-one-on-ones"] });
      toast.success("Reunião atualizada");
    },
    onError: (error) => {
      console.error("Error updating 1:1:", error);
      toast.error("Erro ao atualizar reunião");
    },
  });

  const completeOneOnOne = useMutation({
    mutationFn: async ({ id, notes, actionItems }: { id: string; notes?: string; actionItems?: ActionItem[] }) => {
      const { data, error } = await supabase
        .from("performance_one_on_ones")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          notes,
          action_items: actionItems as unknown as Json,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-one-on-ones"] });
      toast.success("Reunião marcada como concluída");
    },
    onError: (error) => {
      console.error("Error completing 1:1:", error);
      toast.error("Erro ao concluir reunião");
    },
  });

  const deleteOneOnOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("performance_one_on_ones")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-one-on-ones"] });
      toast.success("Reunião removida");
    },
    onError: (error) => {
      console.error("Error deleting 1:1:", error);
      toast.error("Erro ao remover reunião");
    },
  });

  // Parse JSON fields
  const parseAgendaItems = (items: Json | null): AgendaItem[] => {
    if (!items || !Array.isArray(items)) return [];
    return items as unknown as AgendaItem[];
  };

  const parseActionItems = (items: Json | null): ActionItem[] => {
    if (!items || !Array.isArray(items)) return [];
    return items as unknown as ActionItem[];
  };

  return {
    oneOnOnes: oneOnOnesQuery.data ?? [],
    isLoading: oneOnOnesQuery.isLoading,
    error: oneOnOnesQuery.error,
    refetch: oneOnOnesQuery.refetch,
    createOneOnOne,
    updateOneOnOne,
    completeOneOnOne,
    deleteOneOnOne,
    parseAgendaItems,
    parseActionItems,
  };
}
