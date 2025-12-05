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

      // Inicializar com valores atuais do funcionário (carry forward)
      let lastKnownSalary = currentData?.salary || 0;
      let lastKnownVariable = currentData?.variable_salary || 0;
      let lastKnownBenefits = currentData?.benefits_value || 0;
      let lastKnownJobTitleId = currentData?.job_title_id;
      let lastKnownGrade = currentData?.grade;
      let lastKnownUnitId = currentData?.unit_id;

      // Criar array de 12 meses com propagação de alterações
      const monthlyProjections: BudgetProjection[] = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const existing = projections?.find(p => p.month === month);
        
        if (existing) {
          // Atualizar "último conhecido" com os valores da projeção
          lastKnownSalary = existing.projected_fixed_salary;
          lastKnownVariable = existing.projected_variable_salary;
          lastKnownBenefits = existing.projected_benefits;
          if (existing.projected_job_title_id) lastKnownJobTitleId = existing.projected_job_title_id;
          if (existing.projected_grade) lastKnownGrade = existing.projected_grade;
          if (existing.projected_unit_id) lastKnownUnitId = existing.projected_unit_id;

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
        
        // Usar ÚLTIMO VALOR CONHECIDO (propaga alterações de meses anteriores)
        return {
          month,
          projected_fixed_salary: lastKnownSalary,
          projected_variable_salary: lastKnownVariable,
          projected_benefits: lastKnownBenefits,
          projected_job_title_id: lastKnownJobTitleId,
          projected_grade: lastKnownGrade,
          projected_unit_id: lastKnownUnitId,
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
