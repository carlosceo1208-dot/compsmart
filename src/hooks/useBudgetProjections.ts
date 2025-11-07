import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BudgetProjection {
  id?: string;
  month: number;
  projected_fixed_salary: number;
  projected_variable_salary: number;
  projected_benefits: number;
  projected_job_title_id?: string;
  projected_grade?: string;
  projected_unit_id?: string;
  change_type?: string;
  justification?: string;
  warningMessage?: string;
}

export const useBudgetProjections = (employeeId: string | null, fiscalYear: number) => {
  return useQuery({
    queryKey: ['budget-projections', employeeId, fiscalYear],
    queryFn: async () => {
      if (!employeeId) return [];

      // Buscar projeções existentes
      const { data: projections, error: projError } = await supabase
        .from('budget_employee_projections')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('fiscal_year', fiscalYear)
        .order('month');

      if (projError) throw projError;

      // Buscar dados atuais do funcionário com faixa salarial
      const { data: currentData } = await supabase
        .from('profiles')
        .select(`
          salary, 
          variable_salary, 
          benefits_value, 
          job_title_id, 
          grade, 
          unit_id,
          job_titles (
            id, 
            title,
            salary_range_id,
            salary_ranges (
              min_value,
              median_value,
              max_value
            )
          )
        `)
        .eq('id', employeeId)
        .single();

      // Criar array de 12 meses
      const monthlyProjections: BudgetProjection[] = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const existing = projections?.find(p => p.month === month);
        
        if (existing) {
          // Verificar se está fora da faixa salarial
          let warningMessage: string | undefined;
          
          if (currentData?.job_titles?.salary_ranges) {
            const range = currentData.job_titles.salary_ranges;
            const salary = existing.projected_fixed_salary;
            
            if (salary < range.min_value) {
              warningMessage = `⚠️ Salário abaixo da faixa mínima (R$ ${range.min_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ ${range.max_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
            } else if (salary > range.max_value) {
              warningMessage = `⚠️ Salário acima da faixa máxima (R$ ${range.min_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ ${range.max_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
            }
          }
          
          return { ...existing, warningMessage };
        }
        
        // Usar valores atuais se não houver projeção
        return {
          month,
          projected_fixed_salary: currentData?.salary || 0,
          projected_variable_salary: currentData?.variable_salary || 0,
          projected_benefits: currentData?.benefits_value || 0,
          projected_job_title_id: currentData?.job_title_id,
          projected_grade: currentData?.grade,
          projected_unit_id: currentData?.unit_id,
          change_type: undefined,
          justification: undefined,
          warningMessage: undefined,
        };
      });

      return monthlyProjections;
    },
    enabled: !!employeeId,
  });
};
