import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MonthlySummary {
  month: number;
  totalFixed: number;
  totalVariable: number;
  totalCash: number;
  totalBenefits: number;
  headcount: number;
}

export const useBudgetSummary = (unitId: string | null, fiscalYear: number) => {
  return useQuery({
    queryKey: ['budget-summary', unitId, fiscalYear],
    queryFn: async () => {
      // 1. Buscar funcionários ativos da unidade
      let employeesQuery = supabase
        .from('profiles')
        .select('id, salary, variable_salary, benefits_value')
        .eq('status', 'active');
      
      if (unitId) {
        employeesQuery = employeesQuery.eq('unit_id', unitId);
      }

      const { data: employees, error: empError } = await employeesQuery;
      if (empError) throw empError;

      const employeeIds = employees?.map(e => e.id) || [];

      // 2. Buscar projeções de funcionários existentes
      let projectionsQuery = supabase
        .from('budget_employee_projections')
        .select('*')
        .eq('fiscal_year', fiscalYear);

      if (employeeIds.length > 0) {
        projectionsQuery = projectionsQuery.in('employee_id', employeeIds);
      }

      const { data: existingProjections } = await projectionsQuery;

      // 3. Buscar contratações planejadas
      let plannedHiresQuery = supabase
        .from('budget_employee_projections')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .eq('is_planned_hire', true);

      if (unitId) {
        plannedHiresQuery = plannedHiresQuery.eq('projected_unit_id', unitId);
      }

      const { data: plannedHires } = await plannedHiresQuery;

      // 4. Calcular totais mensais
      const monthlyTotals: MonthlySummary[] = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        
        let totalFixed = 0;
        let totalVariable = 0;
        let totalBenefits = 0;
        let headcount = 0;

        // Processar funcionários existentes
        employees?.forEach(emp => {
          const projection = existingProjections?.find(p => 
            p.employee_id === emp.id && p.month === month
          );

          // Demissão planejada - pular
          if (projection?.change_type === 'planned_termination') {
            return;
          }

          // Transferência para outra unidade - pular
          if (projection?.change_type === 'transfer_out') {
            return;
          }

          // Usar valores projetados ou atuais
          totalFixed += projection?.projected_fixed_salary || emp.salary || 0;
          totalVariable += projection?.projected_variable_salary || emp.variable_salary || 0;
          totalBenefits += projection?.projected_benefits || emp.benefits_value || 0;
          headcount++;
        });

        // Processar contratações planejadas (começam no mês definido)
        plannedHires?.forEach(hire => {
          if (hire.month <= month) {
            totalFixed += hire.projected_fixed_salary || 0;
            totalVariable += hire.projected_variable_salary || 0;
            totalBenefits += hire.projected_benefits || 0;
            headcount++;
          }
        });

        // Processar transferências de entrada
        const transfersIn = existingProjections?.filter(p => 
          p.month === month && 
          p.change_type === 'transfer_in' && 
          p.projected_unit_id === unitId
        ) || [];

        transfersIn.forEach(transfer => {
          totalFixed += transfer.projected_fixed_salary || 0;
          totalVariable += transfer.projected_variable_salary || 0;
          totalBenefits += transfer.projected_benefits || 0;
          headcount++;
        });

        return {
          month,
          totalFixed,
          totalVariable,
          totalCash: totalFixed + totalVariable,
          totalBenefits,
          headcount,
        };
      });

      const yearTotal = monthlyTotals.reduce((sum, m) => sum + m.totalCash, 0);
      const avgHeadcount = Math.round(monthlyTotals.reduce((sum, m) => sum + m.headcount, 0) / 12);

      return { monthlyTotals, yearTotal, avgHeadcount };
    },
    staleTime: 2 * 60 * 1000,
  });
};
