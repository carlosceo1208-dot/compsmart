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

      // Anos para buscar (últimos 3 anos + ano projetado)
      const yearsToFetch = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

      const results: BudgetYearSummary[] = [];

      for (const year of yearsToFetch) {
        // Buscar projeções do ano
        let projectionsQuery = supabase
          .from('budget_employee_projections')
          .select('projected_fixed_salary, projected_variable_salary, projected_benefits, employee_id, is_planned_hire, projected_unit_id, planned_employee_name')
          .eq('fiscal_year', year)
          .eq('is_active', true);

        if (unitId) {
          projectionsQuery = projectionsQuery.eq('projected_unit_id', unitId);
        }

        const { data: projections } = await projectionsQuery;

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
        }

        // Calcular totais
        const totalFixed = projections?.reduce((sum, p) => sum + Number(p.projected_fixed_salary || 0), 0) || 0;
        const totalVariable = projections?.reduce((sum, p) => sum + Number(p.projected_variable_salary || 0), 0) || 0;
        const totalBenefits = projections?.reduce((sum, p) => sum + Number(p.projected_benefits || 0), 0) || 0;
        
        // Contar headcount
        let headcount = 0;
        
        // Contar contratações planejadas por nome único (não por linha mensal)
        const uniquePlannedHires = new Set(
          projections
            ?.filter(p => p.is_planned_hire && p.planned_employee_name)
            .map(p => p.planned_employee_name)
        );
        const plannedHiresCount = uniquePlannedHires.size;
        
        if (year === currentYear) {
          // Para o ano atual, buscar funcionários ativos da tabela profiles
          let employeesQuery = supabase
            .from('profiles')
            .select('id')
            .eq('root_company_id', activeCompanyId)
            .eq('status', 'active')
            .not('salary', 'is', null);
          
          if (unitId) {
            employeesQuery = employeesQuery.eq('unit_id', unitId);
          }
          
          const { data: activeEmployees } = await employeesQuery;
          const activeCount = activeEmployees?.length || 0;
          headcount = activeCount + plannedHiresCount;
        } else if (year < currentYear) {
          // Para anos anteriores, estimar baseado em funcionários contratados até aquele ano
          const endOfYear = `${year}-12-31`;
          
          let historicalQuery = supabase
            .from('profiles')
            .select('id')
            .eq('root_company_id', activeCompanyId)
            .lte('hire_date', endOfYear)
            .not('salary', 'is', null);
          
          if (unitId) {
            historicalQuery = historicalQuery.eq('unit_id', unitId);
          }
          
          const { data: historicalEmployees } = await historicalQuery;
          headcount = historicalEmployees?.length || 0;
        } else {
          // Para anos futuros, usar contagem de projeções
          const uniqueEmployees = new Set(
            projections?.filter(p => p.employee_id).map(p => p.employee_id)
          );
          headcount = uniqueEmployees.size + plannedHiresCount;
        }

        // Multiplicar por 12 para obter valor anual
        const annualFixed = totalFixed * 12;
        const annualVariable = totalVariable * 12;
        const annualBenefits = totalBenefits * 12;

        results.push({
          year,
          totalFixed: annualFixed,
          totalVariable: annualVariable,
          totalBenefits: annualBenefits,
          totalCost: annualFixed + annualVariable + annualBenefits,
          headcount,
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
