import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BudgetPlanningAnnualKPI {
  // Dados Atuais (baseline)
  currentYear: number;
  currentAnnualSalary: number;      // Baseado no custo real do ano atual
  currentHeadcount: number;          // Funcionários ativos hoje
  
  // Dados Projetados (planejamento)
  projectedYear: number;
  projectedAnnualSalary: number;    // Baseline automático + alterações
  projectedHeadcount: number;        // HC atual + contratações - desligamentos
  
  // Variações
  salaryVariance: number;            // Projetado - Atual (anualizado)
  salaryVariancePercent: number;     // Variação %
  headcountVariance: number;         // HC Projetado - HC Atual
  headcountVariancePercent: number;  // Variação %
  
  // Status
  hasPlanning: boolean;              // Se existe planejamento/submissão
  submissionStatus?: 'draft' | 'pending' | 'approved' | 'rejected';
  fiscalYear: number;
}

export const useBudgetPlanningAnnualKPI = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const nextYear = currentYear + 1;

  return useQuery({
    queryKey: ['budget-planning-annual-kpi', nextYear],
    queryFn: async () => {
      // 1. Buscar funcionários atuais com data de admissão
      const { data: currentEmployees, error: currentError } = await supabase
        .from('profiles')
        .select('id, salary, variable_salary, benefits_value, hire_date')
        .eq('status', 'active')
        .not('salary', 'is', null);

      if (currentError) throw currentError;

      // 2. Calcular baseline do ano ATUAL (2025)
      // Considera apenas os meses em que o funcionário esteve ativo
      let currentAnnualSalary = 0;
      
      currentEmployees.forEach(emp => {
        const monthlySalary = (emp.salary || 0) + (emp.variable_salary || 0) + (emp.benefits_value || 0);
        
        // Se tem data de admissão no ano atual, calcular meses proporcionais
        if (emp.hire_date) {
          const hireDate = new Date(emp.hire_date);
          const hireYear = hireDate.getFullYear();
          
          if (hireYear === currentYear) {
            // Funcionário contratado no ano atual
            const hireMonth = hireDate.getMonth() + 1; // 1-12
            const monthsWorked = currentMonth - hireMonth + 1;
            const validMonths = Math.max(0, Math.min(monthsWorked, 12));
            currentAnnualSalary += monthlySalary * validMonths;
          } else if (hireYear < currentYear) {
            // Funcionário já estava na empresa antes do ano atual
            currentAnnualSalary += monthlySalary * currentMonth; // Até o mês atual
          }
        } else {
          // Sem data de admissão, assumir ano completo até o mês atual
          currentAnnualSalary += monthlySalary * currentMonth;
        }
      });

      const currentHeadcount = currentEmployees.length;

      // 3. Buscar projeções específicas para o próximo ano
      const { data: projections, error: projectionsError } = await supabase
        .from('budget_employee_projections')
        .select('*')
        .eq('fiscal_year', nextYear)
        .eq('is_active', true);

      if (projectionsError) throw projectionsError;

      // 4. Verificar status de submissão
      const { data: submissions, error: submissionsError } = await supabase
        .from('budget_submissions')
        .select('status')
        .eq('fiscal_year', nextYear)
        .order('created_at', { ascending: false })
        .limit(1);

      if (submissionsError) throw submissionsError;

      // 5. Calcular projeção para próximo ano (BASELINE AUTOMÁTICO)
      // Lógica: todos funcionários atuais continuam com salário atual × 12
      // + alterações específicas (aumentos, promoções)
      // + novas contratações
      
      const employeeIdsWithProjection = new Set<string>();
      const plannedHireNames = new Set<string>();
      let projectedAnnualSalary = 0;

      // Primeiro: processar projeções específicas
      projections?.forEach(proj => {
        if (proj.is_planned_hire) {
          // Nova contratação
          const key = proj.planned_employee_name || proj.id;
          if (!plannedHireNames.has(key)) {
            plannedHireNames.add(key);
          }
          const monthlySalary = (proj.projected_fixed_salary || 0) + 
                               (proj.projected_variable_salary || 0) + 
                               (proj.projected_benefits || 0);
          // Considerar meses a partir do mês da contratação
          const monthsActive = 12 - proj.month + 1;
          projectedAnnualSalary += monthlySalary * Math.max(1, monthsActive);
        } else if (proj.employee_id) {
          // Funcionário existente com alteração
          employeeIdsWithProjection.add(proj.employee_id);
          const monthlySalary = (proj.projected_fixed_salary || 0) + 
                               (proj.projected_variable_salary || 0) + 
                               (proj.projected_benefits || 0);
          // Considera a projeção mensal (pode ser ajuste parcial)
          projectedAnnualSalary += monthlySalary;
        }
      });

      // Segundo: adicionar baseline para funcionários SEM projeção específica
      currentEmployees.forEach(emp => {
        if (!employeeIdsWithProjection.has(emp.id)) {
          // Sem projeção = manter salário atual × 12 meses
          const monthlySalary = (emp.salary || 0) + (emp.variable_salary || 0) + (emp.benefits_value || 0);
          projectedAnnualSalary += monthlySalary * 12;
        }
      });

      // Headcount projetado = atual + novas contratações
      const projectedHeadcount = currentHeadcount + plannedHireNames.size;

      // 6. Calcular baseline anualizado do ano atual para comparação
      // Para comparação YoY, precisamos anualizar o custo atual
      const annualizedCurrentSalary = currentEmployees.reduce((sum, emp) => {
        const monthly = (emp.salary || 0) + (emp.variable_salary || 0) + (emp.benefits_value || 0);
        return sum + (monthly * 12);
      }, 0);

      // 7. Calcular variações (comparando projetado com baseline anualizado)
      const salaryVariance = projectedAnnualSalary - annualizedCurrentSalary;
      const salaryVariancePercent = annualizedCurrentSalary > 0 
        ? (salaryVariance / annualizedCurrentSalary) * 100 
        : 0;

      const headcountVariance = projectedHeadcount - currentHeadcount;
      const headcountVariancePercent = currentHeadcount > 0 
        ? (headcountVariance / currentHeadcount) * 100 
        : 0;

      // 8. Determinar se há planejamento
      const hasPlanning = (projections && projections.length > 0) || 
                          (submissions && submissions.length > 0);

      let submissionStatus: 'draft' | 'pending' | 'approved' | 'rejected' | undefined;
      if (submissions && submissions.length > 0) {
        submissionStatus = submissions[0].status as any;
      }

      return {
        currentYear,
        currentAnnualSalary: annualizedCurrentSalary, // Usar anualizado para comparação
        currentHeadcount,
        projectedYear: nextYear,
        projectedAnnualSalary,
        projectedHeadcount,
        salaryVariance,
        salaryVariancePercent,
        headcountVariance,
        headcountVariancePercent,
        hasPlanning,
        submissionStatus,
        fiscalYear: nextYear,
      } as BudgetPlanningAnnualKPI;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};
