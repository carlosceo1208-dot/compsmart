import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { kudosCategoryLabels, kudosCategoryEmojis, type KudosCategory } from "./usePerformanceKudos";

export interface EmployeeKudos {
  id: string;
  category: KudosCategory;
  message: string;
  is_public: boolean;
  created_at: string;
  from_employee: {
    full_name: string;
    avatar_url: string | null;
    job_title: string | null;
  } | null;
}

interface UseEmployeeKudosOptions {
  employeeId: string;
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
}

export function useEmployeeKudos({ employeeId, startDate, endDate }: UseEmployeeKudosOptions) {
  const { activeCompanyId } = useCompanyContext();

  const { data: kudos = [], isLoading, error } = useQuery({
    queryKey: ["employee-kudos", employeeId, activeCompanyId, startDate, endDate],
    queryFn: async () => {
      if (!activeCompanyId || !employeeId) return [];

      let query = supabase
        .from("performance_kudos")
        .select(`
          id,
          category,
          message,
          is_public,
          created_at,
          from_employee:profiles!performance_kudos_from_employee_id_fkey(
            full_name, 
            avatar_url, 
            job_title
          )
        `)
        .eq("root_company_id", activeCompanyId)
        .eq("to_employee_id", employeeId)
        .order("created_at", { ascending: false });

      // Filtrar por período se fornecido
      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as EmployeeKudos[];
    },
    enabled: !!activeCompanyId && !!employeeId,
  });

  // Agrupar por categoria para exibição
  const kudosByCategory = kudos.reduce((acc, k) => {
    if (!acc[k.category]) {
      acc[k.category] = [];
    }
    acc[k.category].push(k);
    return acc;
  }, {} as Record<KudosCategory, EmployeeKudos[]>);

  return {
    kudos,
    kudosByCategory,
    isLoading,
    error,
    totalKudos: kudos.length,
    // Helpers para exibição
    getCategoryLabel: (category: KudosCategory) => kudosCategoryLabels[category],
    getCategoryEmoji: (category: KudosCategory) => kudosCategoryEmojis[category],
  };
}
