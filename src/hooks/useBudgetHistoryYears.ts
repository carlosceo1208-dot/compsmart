import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

export interface BudgetYearSummary {
  year: number;
  totalFixed: number;
  totalVariable: number;
  totalBenefits: number;
  totalCost: number;
  headcount: number;
  status: 'approved' | 'pending' | 'draft' | 'rejected' | 'none';
  approvedAt?: string;
  unitId?: string;
  unitName?: string;
}

export const useBudgetHistoryYears = (unitId?: string | null) => {
  const { activeCompanyId } = useCompanyContext();
  const currentYear = new Date().getFullYear();

  return useQuery({
    queryKey: ['budget-history-years', activeCompanyId, unitId],
    queryFn: async (): Promise<BudgetYearSummary[]> => {
      if (!activeCompanyId) return [];

      // Buscar unidades da empresa
      const { data: units } = await supabase
        .from('organizational_structure')
        .select('id, name')
        .eq('root_company_id', activeCompanyId);

      const unitMap = new Map(units?.map(u => [u.id, u.name]) || []);

      // Anos para buscar (apenas anos passados + ano atual - SEM anos futuros)
      const yearsToFetch = [currentYear - 2, currentYear - 1, currentYear];

      const results: BudgetYearSummary[] = [];

      for (const year of yearsToFetch) {
        // Buscar status de submissão do ano
        let submissionsQuery = supabase
          .from('budget_submissions')
          .select('status, reviewed_at, unit_id')
          .eq('fiscal_year', year);

        if (unitId) {
          submissionsQuery = submissionsQuery.eq('unit_id', unitId);
        }

        const { data: submissions } = await submissionsQuery;

        // Determinar status geral
        let status: BudgetYearSummary['status'] = 'none';
        let approvedAt: string | undefined;

        if (submissions && submissions.length > 0) {
          const allApproved = submissions.every(s => s.status === 'approved');
          const anyPending = submissions.some(s => s.status === 'pending');
          const anyRejected = submissions.some(s => s.status === 'rejected');

          if (allApproved) {
            status = 'approved';
            const latestApproved = submissions.find(s => s.reviewed_at);
            approvedAt = latestApproved?.reviewed_at || undefined;
          } else if (anyRejected) {
            status = 'rejected';
          } else if (anyPending) {
            status = 'pending';
          } else {
            status = 'draft';
          }
        } else if (year < currentYear) {
          // Anos anteriores sem submissão são considerados aprovados
          status = 'approved';
        }

        // ========== LÓGICA DO ANO ATUAL (2026) ==========
        // Usa a mesma lógica do useBudgetPlanningAnnualKPI para garantir valores corretos
        if (year === currentYear) {
          // Buscar funcionários ativos
          let employeesQuery = supabase
            .from('profiles')
            .select('id, salary, variable_salary, benefits_value')
            .eq('root_company_id', activeCompanyId)
            .eq('status', 'active')
            .not('employee_number', 'is', null)
            .not('salary', 'is', null);

          if (unitId) {
            employeesQuery = employeesQuery.eq('unit_id', unitId);
          }

          const { data: employees } = await employeesQuery;

          // Buscar projeções do ano atual
          let projectionsQuery = supabase
            .from('budget_employee_projections')
            .select('employee_id, month, projected_fixed_salary, projected_variable_salary, projected_benefits, is_planned_hire')
            .eq('fiscal_year', currentYear)
            .eq('is_active', true);

          if (unitId) {
            projectionsQuery = projectionsQuery.eq('projected_unit_id', unitId);
          }

          const { data: projections } = await projectionsQuery;

          let totalFixed = 0;
          let totalVariable = 0;
          let totalBenefits = 0;

          // Agrupar projeções por funcionário
          const employeeProjectionsMap = new Map<string, typeof projections>();
          projections?.filter(p => !p.is_planned_hire && p.employee_id).forEach(proj => {
            const list = employeeProjectionsMap.get(proj.employee_id!) || [];
            list.push(proj);
            employeeProjectionsMap.set(proj.employee_id!, list);
          });

          const employeeIdsWithProjection = new Set(employeeProjectionsMap.keys());

          // Calcular para funcionários COM projeções (mês a mês)
          employeeProjectionsMap.forEach((projList, empId) => {
            const emp = employees?.find(e => e.id === empId);
            if (emp) {
              let lastSalary = Number(emp.salary) || 0;
              let lastVariable = Number(emp.variable_salary) || 0;
              let lastBenefits = Number(emp.benefits_value) || 0;

              for (let month = 1; month <= 12; month++) {
                const proj = projList.find(p => p.month === month);
                if (proj) {
                  lastSalary = Number(proj.projected_fixed_salary) || lastSalary;
                  lastVariable = Number(proj.projected_variable_salary) ?? lastVariable;
                  lastBenefits = Number(proj.projected_benefits) ?? lastBenefits;
                }
                totalFixed += lastSalary;
                totalVariable += lastVariable;
                totalBenefits += lastBenefits;
              }
            }
          });

          // Calcular para funcionários SEM projeções (salário base x 12)
          employees?.forEach(emp => {
            if (!employeeIdsWithProjection.has(emp.id)) {
              totalFixed += (Number(emp.salary) || 0) * 12;
              totalVariable += (Number(emp.variable_salary) || 0) * 12;
              totalBenefits += (Number(emp.benefits_value) || 0) * 12;
            }
          });

          // Adicionar contratações planejadas
          projections?.filter(p => p.is_planned_hire).forEach(proj => {
            totalFixed += Number(proj.projected_fixed_salary) || 0;
            totalVariable += Number(proj.projected_variable_salary) || 0;
            totalBenefits += Number(proj.projected_benefits) || 0;
          });

          // Contar headcount
          const plannedHiresCount = new Set(
            projections?.filter(p => p.is_planned_hire).map(p => p.employee_id || `planned-${p.month}`)
          ).size;
          const headcount = (employees?.length || 0) + plannedHiresCount;

          results.push({
            year,
            totalFixed,
            totalVariable,
            totalBenefits,
            totalCost: totalFixed + totalVariable + totalBenefits,
            headcount,
            status,
            approvedAt,
            unitId: unitId || undefined,
            unitName: unitId ? unitMap.get(unitId) : undefined,
          });

          continue;
        }

        // ========== LÓGICA PARA ANOS ANTERIORES ==========
        const endOfYear = `${year}-12-31`;
        
        let employeesQuery = supabase
          .from('profiles')
          .select('id, salary, variable_salary, benefits_value, hire_date')
          .eq('root_company_id', activeCompanyId)
          .lte('hire_date', endOfYear)
          .not('salary', 'is', null);
        
        if (unitId) {
          employeesQuery = employeesQuery.eq('unit_id', unitId);
        }
        
        const { data: histEmployees } = await employeesQuery;
        
        // Calcular valores anuais baseado nos funcionários
        let calcFixed = 0;
        let calcVariable = 0;
        let calcBenefits = 0;
        
        histEmployees?.forEach(emp => {
          let monthsWorked = 12;
          
          if (emp.hire_date) {
            const hireDate = new Date(emp.hire_date);
            if (hireDate.getFullYear() === year) {
              monthsWorked = Math.max(1, 12 - hireDate.getMonth());
            }
          }
          
          calcFixed += (Number(emp.salary) || 0) * monthsWorked;
          calcVariable += (Number(emp.variable_salary) || 0) * monthsWorked;
          calcBenefits += (Number(emp.benefits_value) || 0) * monthsWorked;
        });
        
        results.push({
          year,
          totalFixed: calcFixed,
          totalVariable: calcVariable,
          totalBenefits: calcBenefits,
          totalCost: calcFixed + calcVariable + calcBenefits,
          headcount: histEmployees?.length || 0,
          status,
          approvedAt,
          unitId: unitId || undefined,
          unitName: unitId ? unitMap.get(unitId) : undefined,
        });
      }

      // Ordenar do mais antigo ao mais recente
      return results.sort((a, b) => a.year - b.year);
    },
    enabled: !!activeCompanyId,
  });
};
