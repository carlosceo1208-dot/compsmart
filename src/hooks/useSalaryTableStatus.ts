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

      // "Configurada" = a empresa possui uma tabela ATIVA, NÃO-template e com pelo menos 1 faixa.
      const { data: tables, error: tablesError } = await supabase
        .from('salary_tables')
        .select('id, is_active, is_template, salary_ranges(id)')
        .eq('root_company_id', activeCompanyId);

      if (tablesError) throw tablesError;

      const hasActiveConfigured = (tables ?? []).some(
        (t: any) =>
          t.is_active &&
          !t.is_template &&
          Array.isArray(t.salary_ranges) &&
          t.salary_ranges.length > 0
      );

      // Count employees with salary
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('root_company_id', activeCompanyId)
        .not('salary', 'is', null);

      if (countError) throw countError;

      return {
        hasActiveTable: hasActiveConfigured,
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
