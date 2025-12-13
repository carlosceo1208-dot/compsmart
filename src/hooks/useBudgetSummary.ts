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

      // 2. Buscar todas as projeções (funcionários + contratações planejadas)
      let projectionsQuery = supabase
        .from('budget_employee_projections')
        .select('*')
        .eq('fiscal_year', fiscalYear);

      if (unitId) {
        // Para contratações planejadas, usar projected_unit_id
        // Para funcionários, filtrar depois pelos IDs
        projectionsQuery = projectionsQuery.or(`projected_unit_id.eq.${unitId},employee_id.in.(${employeeIds.join(',')})`);
      } else if (employeeIds.length > 0) {
        projectionsQuery = projectionsQuery.or(`is_planned_hire.eq.true,employee_id.in.(${employeeIds.join(',')})`);
      }

      const { data: allProjections } = await projectionsQuery;

      // 3. Buscar ajuste coletivo aprovado para o ano fiscal
      const { data: approvedAdjustments } = await supabase
        .from('collective_salary_adjustments')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .eq('status', 'approved_budget')
        .limit(1);

      const collectiveAdjustment = approvedAdjustments?.[0];

      // 3. Preparar carry forward por funcionário
      // Para cada funcionário, inicializar com valores atuais e propagar alterações
      const employeeCarryForward = new Map<string, {
        salary: number;
        variable: number;
        benefits: number;
        terminated: boolean;
        transferredOut: boolean;
      }>();

      // Inicializar com valores atuais de cada funcionário
      employees?.forEach(emp => {
        employeeCarryForward.set(emp.id, {
          salary: emp.salary || 0,
          variable: emp.variable_salary || 0,
          benefits: emp.benefits_value || 0,
          terminated: false,
          transferredOut: false,
        });
      });

      // Processar projeções mês a mês para atualizar carry forward
      for (let month = 1; month <= 12; month++) {
        employees?.forEach(emp => {
          const projection = allProjections?.find(p => 
            p.employee_id === emp.id && 
            p.month === month &&
            !p.is_planned_hire
          );

          if (projection) {
            const current = employeeCarryForward.get(emp.id)!;
            
            // Marcar demissão
            if (projection.change_type === 'planned_termination') {
              current.terminated = true;
            }
            // Marcar transferência de saída
            else if (projection.change_type === 'transfer_out') {
              current.transferredOut = true;
            }
            // Atualizar valores (carry forward para meses seguintes)
            else {
              current.salary = projection.projected_fixed_salary;
              current.variable = projection.projected_variable_salary;
              current.benefits = projection.projected_benefits;
            }
          }
        });
      }

      // Reinicializar carry forward para calcular totais mensais
      employees?.forEach(emp => {
        employeeCarryForward.set(emp.id, {
          salary: emp.salary || 0,
          variable: emp.variable_salary || 0,
          benefits: emp.benefits_value || 0,
          terminated: false,
          transferredOut: false,
        });
      });

      // 4. Calcular totais mensais com carry forward correto
      const monthlyTotals: MonthlySummary[] = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        
        let totalFixed = 0;
        let totalVariable = 0;
        let totalBenefits = 0;
        const uniqueIds = new Set<string>();

        // Processar funcionários existentes com carry forward
        employees?.forEach(emp => {
          const current = employeeCarryForward.get(emp.id)!;
          
          // Pular se já foi demitido ou transferido
          if (current.terminated || current.transferredOut) {
            return;
          }

          const projection = allProjections?.find(p => 
            p.employee_id === emp.id && 
            p.month === month &&
            !p.is_planned_hire
          );

          if (projection) {
            // Demissão planejada - marcar e pular
            if (projection.change_type === 'planned_termination') {
              current.terminated = true;
              return;
            }

            // Transferência para outra unidade - marcar e pular
            if (projection.change_type === 'transfer_out') {
              current.transferredOut = true;
              return;
            }

            // Atualizar carry forward com valores da projeção (mérito individual)
            current.salary = projection.projected_fixed_salary;
            current.variable = projection.projected_variable_salary;
            current.benefits = projection.projected_benefits;
          }

          // Aplicar ajuste coletivo se estiver no mês efetivo ou após
          let salaryWithAdjustment = current.salary;
          if (collectiveAdjustment && month >= collectiveAdjustment.effective_month) {
            const percentage = collectiveAdjustment.fixed_percentage || 0;
            salaryWithAdjustment = current.salary * (1 + percentage / 100);
          }

          // Usar valores do carry forward com ajuste coletivo aplicado
          totalFixed += salaryWithAdjustment;
          totalVariable += current.variable;
          totalBenefits += current.benefits;
          uniqueIds.add(emp.id);
        });

        // Processar contratações planejadas (ativas a partir do mês de contratação)
        const plannedHiresForMonth = allProjections?.filter(p => 
          p.is_planned_hire && 
          p.month === month
        ) || [];

        plannedHiresForMonth.forEach(hire => {
          totalFixed += hire.projected_fixed_salary || 0;
          totalVariable += hire.projected_variable_salary || 0;
          totalBenefits += hire.projected_benefits || 0;
          uniqueIds.add(hire.planned_employee_name || hire.id);
        });

        // Processar transferências de entrada
        const transfersIn = allProjections?.filter(p => 
          p.month === month && 
          p.change_type === 'transfer_in' && 
          p.projected_unit_id === unitId &&
          !p.is_planned_hire
        ) || [];

        transfersIn.forEach(transfer => {
          totalFixed += transfer.projected_fixed_salary || 0;
          totalVariable += transfer.projected_variable_salary || 0;
          totalBenefits += transfer.projected_benefits || 0;
          if (transfer.employee_id) uniqueIds.add(transfer.employee_id);
        });

        return {
          month,
          totalFixed,
          totalVariable,
          totalCash: totalFixed + totalVariable,
          totalBenefits,
          headcount: uniqueIds.size,
        };
      });

      const yearTotal = monthlyTotals.reduce((sum, m) => sum + m.totalCash, 0);
      // Use final headcount (December) instead of average for TOTAL row
      const finalHeadcount = monthlyTotals[11]?.headcount || 0;

      return { monthlyTotals, yearTotal, avgHeadcount: finalHeadcount };
    },
    staleTime: 2 * 60 * 1000,
  });
};
