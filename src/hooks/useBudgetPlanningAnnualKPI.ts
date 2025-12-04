import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApprovedAdjustment {
  id: string;
  name: string;
  percentage: number;
  annualCost: number;
  monthlyCost: number;
  effectiveMonth: number;
  employeesAffected: number;
}

export interface BudgetPlanningAnnualKPI {
  // Dados Atuais (baseline) - SEPARADOS
  currentYear: number;
  currentFixedSalary: number;
  currentVariableSalary: number;
  currentBenefits: number;
  currentTotal: number;
  currentHeadcount: number;
  
  // Dados Projetados (planejamento) - SEPARADOS
  projectedYear: number;
  projectedFixedSalary: number;
  projectedVariableSalary: number;
  projectedBenefits: number;
  projectedTotal: number;
  projectedHeadcount: number;
  
  // Variações
  salaryVariance: number;
  salaryVariancePercent: number;
  headcountVariance: number;
  headcountVariancePercent: number;
  
  // Ajuste Coletivo Aprovado (se existir)
  approvedAdjustment?: ApprovedAdjustment;
  
  // Status
  hasPlanning: boolean;
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

      // 2. Calcular baseline do ano ATUAL - SEPARADO
      let currentFixedSalary = 0;
      let currentVariableSalary = 0;
      let currentBenefits = 0;
      
      currentEmployees.forEach(emp => {
        const fixedMonthly = emp.salary || 0;
        const variableMonthly = emp.variable_salary || 0;
        const benefitsMonthly = emp.benefits_value || 0;
        
        // Se tem data de admissão no ano atual, calcular meses proporcionais
        if (emp.hire_date) {
          const hireDate = new Date(emp.hire_date);
          const hireYear = hireDate.getFullYear();
          
          if (hireYear === currentYear) {
            const hireMonth = hireDate.getMonth() + 1;
            const monthsWorked = currentMonth - hireMonth + 1;
            const validMonths = Math.max(0, Math.min(monthsWorked, 12));
            currentFixedSalary += fixedMonthly * validMonths;
            currentVariableSalary += variableMonthly * validMonths;
            currentBenefits += benefitsMonthly * validMonths;
          } else if (hireYear < currentYear) {
            currentFixedSalary += fixedMonthly * currentMonth;
            currentVariableSalary += variableMonthly * currentMonth;
            currentBenefits += benefitsMonthly * currentMonth;
          }
        } else {
          currentFixedSalary += fixedMonthly * currentMonth;
          currentVariableSalary += variableMonthly * currentMonth;
          currentBenefits += benefitsMonthly * currentMonth;
        }
      });

      const currentTotal = currentFixedSalary + currentVariableSalary + currentBenefits;
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

      // 5. Buscar ajuste coletivo aprovado para o próximo ano
      const { data: approvedAdjustments, error: adjustmentError } = await supabase
        .from('collective_salary_adjustments')
        .select('*')
        .eq('fiscal_year', nextYear)
        .eq('status', 'approved_budget')
        .limit(1);

      if (adjustmentError) throw adjustmentError;

      // 6. Calcular projeção para próximo ano (BASELINE AUTOMÁTICO) - SEPARADO
      const employeeIdsWithProjection = new Set<string>();
      const plannedHireNames = new Set<string>();
      let projectedFixedSalary = 0;
      let projectedVariableSalary = 0;
      let projectedBenefits = 0;

      // Primeiro: processar contratações planejadas
      // IMPORTANTE: Cada registro já representa UM mês específico, então apenas somar
      projections?.filter(p => p.is_planned_hire).forEach(proj => {
        const key = proj.planned_employee_name || proj.id;
        if (!plannedHireNames.has(key)) {
          plannedHireNames.add(key);
        }
        // Cada registro = 1 mês, simplesmente somar
        projectedFixedSalary += (proj.projected_fixed_salary || 0);
        projectedVariableSalary += (proj.projected_variable_salary || 0);
        projectedBenefits += (proj.projected_benefits || 0);
      });

      // Segundo: processar funcionários existentes COM alteração salarial
      // Agrupa projeções por employee_id para pegar a mais antiga (mês de início da alteração)
      const employeeProjections = new Map<string, typeof projections[0]>();
      projections?.filter(p => !p.is_planned_hire && p.employee_id).forEach(proj => {
        const existing = employeeProjections.get(proj.employee_id!);
        if (!existing || proj.month < existing.month) {
          employeeProjections.set(proj.employee_id!, proj);
        }
      });

      employeeProjections.forEach((proj, empId) => {
        employeeIdsWithProjection.add(empId);
        const emp = currentEmployees.find(e => e.id === empId);
        
        if (emp) {
          // Meses ANTES da alteração: usar salário atual
          const monthsBefore = Math.max(0, proj.month - 1);
          projectedFixedSalary += (emp.salary || 0) * monthsBefore;
          projectedVariableSalary += (emp.variable_salary || 0) * monthsBefore;
          projectedBenefits += (emp.benefits_value || 0) * monthsBefore;
          
          // Meses A PARTIR da alteração: usar salário projetado
          const monthsAfter = 12 - proj.month + 1;
          projectedFixedSalary += (proj.projected_fixed_salary || 0) * monthsAfter;
          projectedVariableSalary += (proj.projected_variable_salary || 0) * monthsAfter;
          projectedBenefits += (proj.projected_benefits || 0) * monthsAfter;
        }
      });

      // Terceiro: adicionar baseline para funcionários SEM projeção específica
      currentEmployees.forEach(emp => {
        if (!employeeIdsWithProjection.has(emp.id)) {
          projectedFixedSalary += (emp.salary || 0) * 12;
          projectedVariableSalary += (emp.variable_salary || 0) * 12;
          projectedBenefits += (emp.benefits_value || 0) * 12;
        }
      });

      // 7. Processar ajuste coletivo aprovado e incluir no projetado
      let approvedAdjustment: ApprovedAdjustment | undefined;
      
      if (approvedAdjustments && approvedAdjustments.length > 0) {
        const adj = approvedAdjustments[0];
        approvedAdjustment = {
          id: adj.id,
          name: adj.adjustment_name,
          percentage: adj.fixed_percentage || 0,
          annualCost: adj.total_annual_cost || 0,
          monthlyCost: adj.total_monthly_cost || 0,
          effectiveMonth: adj.effective_month,
          employeesAffected: adj.total_employees_affected || 0,
        };
        
        // Incluir custo do ajuste coletivo no salário fixo projetado
        // O custo anual já considera os meses de vigência
        projectedFixedSalary += approvedAdjustment.annualCost;
      }

      const projectedTotal = projectedFixedSalary + projectedVariableSalary + projectedBenefits;
      const projectedHeadcount = currentHeadcount + plannedHireNames.size;

      // 8. Calcular baseline anualizado do ano atual para comparação
      const annualizedCurrentFixed = currentEmployees.reduce((sum, emp) => sum + (emp.salary || 0) * 12, 0);
      const annualizedCurrentVariable = currentEmployees.reduce((sum, emp) => sum + (emp.variable_salary || 0) * 12, 0);
      const annualizedCurrentBenefits = currentEmployees.reduce((sum, emp) => sum + (emp.benefits_value || 0) * 12, 0);
      const annualizedCurrentTotal = annualizedCurrentFixed + annualizedCurrentVariable + annualizedCurrentBenefits;

      // 9. Calcular variações (comparando projetado com baseline anualizado)
      const salaryVariance = projectedTotal - annualizedCurrentTotal;
      const salaryVariancePercent = annualizedCurrentTotal > 0 
        ? (salaryVariance / annualizedCurrentTotal) * 100 
        : 0;

      const headcountVariance = projectedHeadcount - currentHeadcount;
      const headcountVariancePercent = currentHeadcount > 0 
        ? (headcountVariance / currentHeadcount) * 100 
        : 0;

      // 10. Determinar se há planejamento
      const hasPlanning = (projections && projections.length > 0) || 
                          (submissions && submissions.length > 0) ||
                          !!approvedAdjustment;

      let submissionStatus: 'draft' | 'pending' | 'approved' | 'rejected' | undefined;
      if (submissions && submissions.length > 0) {
        submissionStatus = submissions[0].status as any;
      }

      return {
        currentYear,
        currentFixedSalary: annualizedCurrentFixed,
        currentVariableSalary: annualizedCurrentVariable,
        currentBenefits: annualizedCurrentBenefits,
        currentTotal: annualizedCurrentTotal,
        currentHeadcount,
        projectedYear: nextYear,
        projectedFixedSalary,
        projectedVariableSalary,
        projectedBenefits,
        projectedTotal,
        projectedHeadcount,
        salaryVariance,
        salaryVariancePercent,
        headcountVariance,
        headcountVariancePercent,
        approvedAdjustment,
        hasPlanning,
        submissionStatus,
        fiscalYear: nextYear,
      } as BudgetPlanningAnnualKPI;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};
