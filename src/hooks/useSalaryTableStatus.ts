import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

export const useSalaryTableStatus = () => {
  const { activeCompanyId } = useCompanyContext();

  const { data, isLoading } = useQuery({
    queryKey: ['salary-table-status', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) {
        return { hasActiveTable: false, employeeCount: 0 };
      }

      // Check if company has an active salary table
      const { data: tables, error: tablesError } = await supabase
        .from('salary_tables')
        .select('id')
        .eq('root_company_id', activeCompanyId)
        .eq('is_active', true)
        .limit(1);

      if (tablesError) throw tablesError;

      // Count employees with salary
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('root_company_id', activeCompanyId)
        .not('salary', 'is', null);

      if (countError) throw countError;

      return {
        hasActiveTable: tables && tables.length > 0,
        employeeCount: count || 0,
      };
    },
    enabled: !!activeCompanyId,
    staleTime: 30 * 1000, // 30 seconds - reduced for better responsiveness
  });

  return {
    hasActiveTable: data?.hasActiveTable ?? false,
    employeeCount: data?.employeeCount ?? 0,
    isLoading,
  };
};
