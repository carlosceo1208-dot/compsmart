import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

export interface BudgetVarianceAlert {
  id: string;
  year: number;
  previousYear: number;
  previousTotal: number;
  currentTotal: number;
  variancePercent: number;
  thresholdPercent: number;
  exceedsThreshold: boolean;
  unitId?: string;
  unitName?: string;
}

export const useBudgetVarianceAlert = () => {
  const { activeCompanyId } = useCompanyContext();
  const currentYear = new Date().getFullYear();
  const projectedYear = currentYear + 1;

  return useQuery({
    queryKey: ['budget-variance-alert', activeCompanyId],
    queryFn: async (): Promise<BudgetVarianceAlert | null> => {
      if (!activeCompanyId) return null;

      // Buscar configuração de alerta de variação orçamentária
      const { data: alertConfig } = await supabase
        .from('alert_configurations')
        .select('*')
        .eq('root_company_id', activeCompanyId)
        .eq('alert_type', 'budget_variance')
        .eq('enabled', true)
        .single();

      const thresholdPercent = alertConfig?.threshold_value || 10; // Default 10%

      // Buscar projeções do ano atual e projetado
      const { data: currentProjections } = await supabase
        .from('budget_employee_projections')
        .select('projected_fixed_salary, projected_variable_salary, projected_benefits')
        .eq('fiscal_year', currentYear)
        .eq('is_active', true);

      const { data: projectedProjections } = await supabase
        .from('budget_employee_projections')
        .select('projected_fixed_salary, projected_variable_salary, projected_benefits')
        .eq('fiscal_year', projectedYear)
        .eq('is_active', true);

      // Calcular totais anuais
      const calculateAnnualTotal = (projections: any[] | null) => {
        if (!projections || projections.length === 0) return 0;
        const monthlyTotal = projections.reduce((sum, p) => 
          sum + Number(p.projected_fixed_salary || 0) + 
          Number(p.projected_variable_salary || 0) + 
          Number(p.projected_benefits || 0), 0
        );
        return monthlyTotal * 12;
      };

      const previousTotal = calculateAnnualTotal(currentProjections);
      const currentTotal = calculateAnnualTotal(projectedProjections);

      if (previousTotal === 0) return null;

      const variancePercent = ((currentTotal - previousTotal) / previousTotal) * 100;
      const exceedsThreshold = variancePercent > thresholdPercent;

      return {
        id: `variance-${projectedYear}`,
        year: projectedYear,
        previousYear: currentYear,
        previousTotal,
        currentTotal,
        variancePercent,
        thresholdPercent,
        exceedsThreshold,
      };
    },
    enabled: !!activeCompanyId,
  });
};

// Hook para buscar threshold configurado
export const useBudgetThreshold = () => {
  const { activeCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['budget-threshold', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return 10; // Default

      const { data } = await supabase
        .from('alert_configurations')
        .select('threshold_value')
        .eq('root_company_id', activeCompanyId)
        .eq('alert_type', 'budget_variance')
        .single();

      return data?.threshold_value || 10;
    },
    enabled: !!activeCompanyId,
  });
};
