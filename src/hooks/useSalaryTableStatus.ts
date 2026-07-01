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

      // Consider "configured" if the company has ANY salary table with at least one range,
      // OR an active salary table. This avoids false alerts when a populated table exists
      // but isn't flagged as active.
      const { data: tables, error: tablesError } = await supabase
        .from('salary_tables')
        .select('id, is_active, salary_ranges(id)')
        .eq('root_company_id', activeCompanyId);

      if (tablesError) throw tablesError;

      const hasConfigured = (tables ?? []).some(
        (t: any) => t.is_active || (Array.isArray(t.salary_ranges) && t.salary_ranges.length > 0)
      );



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
