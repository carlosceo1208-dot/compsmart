import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BudgetPlanningAnnualKPI {
  // Dados Atuais (baseline)
  currentYear: number;
  currentAnnualSalary: number;      // Salário mensal atual × 12
  currentHeadcount: number;          // Funcionários ativos hoje
  
  // Dados Projetados (planejamento)
  projectedYear: number;
  projectedAnnualSalary: number;    // Soma de todas projeções do ano
  projectedHeadcount: number;        // HC único (existentes + contratações)
  
  // Variações
  salaryVariance: number;            // Projetado - Atual
  salaryVariancePercent: number;     // Variação %
  headcountVariance: number;         // HC Projetado - HC Atual
  headcountVariancePercent: number;  // Variação %
  
  // Status
  hasPlanning: boolean;              // Se existe planejamento para o ano
  submissionStatus?: 'draft' | 'pending' | 'approved' | 'rejected';
  fiscalYear: number;
}

export const useBudgetPlanningAnnualKPI = () => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  return useQuery({
    queryKey: ['budget-planning-annual-kpi', nextYear],
    queryFn: async () => {
      // 1. Buscar baseline atual (funcionários × salários atuais)
      const { data: currentEmployees, error: currentError } = await supabase
        .from('profiles')
        .select('id, salary, variable_salary, benefits_value')
        .eq('status', 'active')
        .not('salary', 'is', null);

      if (currentError) throw currentError;

      const currentAnnualSalary = currentEmployees.reduce((sum, emp) => {
        const monthlySalary = (emp.salary || 0) + (emp.variable_salary || 0) + (emp.benefits_value || 0);
        return sum + (monthlySalary * 12);
      }, 0);

      const currentHeadcount = currentEmployees.length;

      // 2. Buscar projeções para o ano fiscal
      const { data: projections, error: projectionsError } = await supabase
        .from('budget_employee_projections')
        .select('*')
        .eq('fiscal_year', nextYear)
        .eq('is_active', true);

      if (projectionsError) throw projectionsError;

      // 3. Verificar status de submissão geral
      const { data: submissions, error: submissionsError } = await supabase
        .from('budget_submissions')
        .select('status')
        .eq('fiscal_year', nextYear)
        .order('created_at', { ascending: false })
        .limit(1);

      if (submissionsError) throw submissionsError;

      const hasPlanning = projections && projections.length > 0;

      if (!hasPlanning) {
        // Sem planejamento - retornar apenas baseline
        return {
          currentYear,
          currentAnnualSalary,
          currentHeadcount,
          projectedYear: nextYear,
          projectedAnnualSalary: 0,
          projectedHeadcount: 0,
          salaryVariance: 0,
          salaryVariancePercent: 0,
          headcountVariance: 0,
          headcountVariancePercent: 0,
          hasPlanning: false,
          fiscalYear: nextYear,
        } as BudgetPlanningAnnualKPI;
      }

      // 4. Calcular totais projetados
      // Agrupar por employee_id/planned_employee_name para calcular custo anual individual
      const employeeProjections = new Map<string, {
        isPlannedHire: boolean;
        annualSalary: number;
      }>();

      projections.forEach(proj => {
        const key = proj.employee_id || proj.planned_employee_name || `temp-${proj.id}`;
        
        if (!employeeProjections.has(key)) {
          employeeProjections.set(key, {
            isPlannedHire: proj.is_planned_hire || false,
            annualSalary: 0,
          });
        }

        const emp = employeeProjections.get(key)!;
        const monthlySalary = (proj.projected_fixed_salary || 0) + 
                             (proj.projected_variable_salary || 0) + 
                             (proj.projected_benefits || 0);
        emp.annualSalary += monthlySalary;
      });

      const projectedAnnualSalary = Array.from(employeeProjections.values())
        .reduce((sum, emp) => sum + emp.annualSalary, 0);

      const projectedHeadcount = employeeProjections.size;

      // 5. Calcular variações
      const salaryVariance = projectedAnnualSalary - currentAnnualSalary;
      const salaryVariancePercent = currentAnnualSalary > 0 
        ? (salaryVariance / currentAnnualSalary) * 100 
        : 0;

      const headcountVariance = projectedHeadcount - currentHeadcount;
      const headcountVariancePercent = currentHeadcount > 0 
        ? (headcountVariance / currentHeadcount) * 100 
        : 0;

      // 6. Determinar status geral
      let submissionStatus: 'draft' | 'pending' | 'approved' | 'rejected' | undefined;
      if (submissions && submissions.length > 0) {
        submissionStatus = submissions[0].status as any;
      }

      return {
        currentYear,
        currentAnnualSalary,
        currentHeadcount,
        projectedYear: nextYear,
        projectedAnnualSalary,
        projectedHeadcount,
        salaryVariance,
        salaryVariancePercent,
        headcountVariance,
        headcountVariancePercent,
        hasPlanning: true,
        submissionStatus,
        fiscalYear: nextYear,
      } as BudgetPlanningAnnualKPI;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};
