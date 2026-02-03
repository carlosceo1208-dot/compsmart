import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

export interface PerformanceEmployee {
  id: string;
  full_name: string;
  job_title: string | null;
  grade: string | null;
  avatar_url: string | null;
  unit_id: string | null;
  manager_id: string | null;
  root_company_id: string | null;
  status: string | null;
  hire_date: string | null;
  unit_name: string | null;
  unit_type: string | null;
  unit_breadcrumb: string | null;
  manager_name: string | null;
  active_goals_count: number;
  active_pdi_count: number;
  pending_feedback_count: number;
  last_evaluation_score: number | null;
  last_evaluation_status: string | null;
}

interface UsePerformanceEmployeesParams {
  unitId?: string;
  search?: string;
  evaluationStatus?: string;
}

export const usePerformanceEmployees = (params: UsePerformanceEmployeesParams = {}) => {
  const { activeCompanyId } = useCompanyContext();
  const { data: userRole } = useCurrentUserRole();

  return useQuery({
    queryKey: ["performance-employees", activeCompanyId, userRole?.userId, params],
    queryFn: async () => {
      if (!activeCompanyId || !userRole?.userId) return [];

      // Primeiro, buscar IDs visíveis usando a função SQL
      const { data: visibleIds, error: visibleError } = await supabase
        .rpc("get_visible_employees", {
          p_user_id: userRole.userId,
          p_company_id: activeCompanyId,
        });

      if (visibleError) {
        console.error("Error fetching visible employees:", visibleError);
        throw visibleError;
      }

      if (!visibleIds || visibleIds.length === 0) return [];

      const employeeIds = visibleIds.map((v: { employee_id: string }) => v.employee_id);

      // Agora buscar os dados da view apenas para esses IDs
      let query = supabase
        .from("v_performance_employees")
        .select("*")
        .in("id", employeeIds)
        .eq("root_company_id", activeCompanyId);

      // Aplicar filtros opcionais
      if (params.unitId) {
        query = query.eq("unit_id", params.unitId);
      }

      if (params.search) {
        query = query.ilike("full_name", `%${params.search}%`);
      }

      if (params.evaluationStatus) {
        query = query.eq("last_evaluation_status", params.evaluationStatus as any);
      }

      query = query.order("full_name");

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching performance employees:", error);
        throw error;
      }

      return (data || []) as PerformanceEmployee[];
    },
    enabled: !!activeCompanyId && !!userRole?.userId,
  });
};

// Hook para KPIs agregados
export const usePerformanceEmployeesKPIs = () => {
  const { data: employees = [], isLoading } = usePerformanceEmployees();

  const kpis = {
    totalEmployees: employees.length,
    withActiveGoals: employees.filter((e) => e.active_goals_count > 0).length,
    withActivePDI: employees.filter((e) => e.active_pdi_count > 0).length,
    pendingEvaluation: employees.filter(
      (e) => e.last_evaluation_status === "pending_review" || e.last_evaluation_status === "draft"
    ).length,
    completedEvaluation: employees.filter(
      (e) => e.last_evaluation_status === "reviewed" || e.last_evaluation_status === "approved"
    ).length,
    pendingFeedback: employees.filter((e) => e.pending_feedback_count > 0).length,
  };

  return { kpis, isLoading };
};
