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
  // Anos para exibição
  previousYear: number;  // 2025 (baseline)
  currentYear: number;   // 2026 (ano aprovado)
  nextYear: number;      // 2027 (para planejamento futuro)
  
  // Dados do Ano Anterior (2025 - baseline)
  previousFixedSalary: number;
  previousVariableSalary: number;
  previousBenefits: number;
  previousTotal: number;
  previousHeadcount: number;
  
  // Dados do Ano Atual (2026 - aprovado)
  currentFixedSalary: number;
  currentVariableSalary: number;
  currentBenefits: number;
  currentTotal: number;
  currentHeadcount: number;
  
  // Variações 2025 vs 2026
  fixedVariancePercent: number;
  variableVariancePercent: number;
  benefitsVariancePercent: number;
  totalVariancePercent: number;
  headcountVariancePercent: number;
  
  // Ajuste Coletivo Aprovado (se existir no ano atual)
  approvedAdjustment?: ApprovedAdjustment;
  
  // Status
  hasCurrentYearApproved: boolean;    // Se 2026 está aprovado
  hasNextYearPlanning: boolean;       // Se há planejamento para 2027
  submissionStatus?: 'draft' | 'pending' | 'approved' | 'rejected';
  fiscalYear: number;
}

export const useBudgetPlanningAnnualKPI = () => {
  const currentYear = new Date().getFullYear();  // 2026
  const previousYear = currentYear - 1;           // 2025
  const nextYear = currentYear + 1;               // 2027

  return useQuery({
    queryKey: ['budget-planning-annual-kpi', previousYear, currentYear, nextYear],
    queryFn: async () => {
      // 1. Buscar funcionários atuais
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('id, salary, variable_salary, benefits_value, hire_date')
        .eq('status', 'active')
        .not('salary', 'is', null);

      if (employeesError) throw employeesError;

      // 2. Calcular dados do ANO ANTERIOR (2025) - baseline para comparação
      let previousFixedSalary = 0;
      let previousVariableSalary = 0;
      let previousBenefits = 0;
      
      employees.forEach(emp => {
        let monthsWorked = 12;
        
        if (emp.hire_date) {
          const hireDate = new Date(emp.hire_date);
          const hireYear = hireDate.getFullYear();
          const hireMonth = hireDate.getMonth() + 1;
          
          if (hireYear === previousYear) {
            monthsWorked = Math.max(1, 12 - hireMonth + 1);
          } else if (hireYear > previousYear) {
            monthsWorked = 0; // Não estava na empresa em 2025
          }
        }
        
        previousFixedSalary += (emp.salary || 0) * monthsWorked;
        previousVariableSalary += (emp.variable_salary || 0) * monthsWorked;
        previousBenefits += (emp.benefits_value || 0) * monthsWorked;
      });

      const previousTotal = previousFixedSalary + previousVariableSalary + previousBenefits;
      const previousHeadcount = employees.filter(emp => {
        if (!emp.hire_date) return true;
        const hireYear = new Date(emp.hire_date).getFullYear();
        return hireYear <= previousYear;
      }).length;

      // 3. Buscar projeções aprovadas do ANO ATUAL (2026)
      const { data: currentYearProjections, error: currentProjectionsError } = await supabase
        .from('budget_employee_projections')
        .select('*')
        .eq('fiscal_year', currentYear)
        .eq('is_active', true);

      if (currentProjectionsError) throw currentProjectionsError;

      // 4. Verificar se há orçamento APROVADO para o ANO ATUAL (2026)
      const { data: currentSubmissions, error: currentSubmissionsError } = await supabase
        .from('budget_submissions')
        .select('status')
        .eq('fiscal_year', currentYear)
        .order('created_at', { ascending: false })
        .limit(1);

      if (currentSubmissionsError) throw currentSubmissionsError;

      const hasCurrentYearApproved = currentSubmissions?.some(s => s.status === 'approved') || false;
      const currentSubmissionStatus = currentSubmissions?.[0]?.status as 'draft' | 'pending' | 'approved' | 'rejected' | undefined;

      // 5. Verificar se há planejamento para o PRÓXIMO ANO (2027)
      const { data: nextYearSubmissions, error: nextSubmissionsError } = await supabase
        .from('budget_submissions')
        .select('status')
        .eq('fiscal_year', nextYear)
        .limit(1);

      if (nextSubmissionsError) throw nextSubmissionsError;

      const { data: nextYearProjections, error: nextProjectionsError } = await supabase
        .from('budget_employee_projections')
        .select('id')
        .eq('fiscal_year', nextYear)
        .limit(1);

      if (nextProjectionsError) throw nextProjectionsError;

      const hasNextYearPlanning = (nextYearSubmissions && nextYearSubmissions.length > 0) || 
                                   (nextYearProjections && nextYearProjections.length > 0);

      // 6. Buscar ajuste coletivo aprovado do ANO ATUAL (2026)
      const { data: approvedAdjustments, error: adjustmentError } = await supabase
        .from('collective_salary_adjustments')
        .select('*')
        .eq('fiscal_year', currentYear)
        .eq('status', 'approved_budget')
        .limit(1);

      if (adjustmentError) throw adjustmentError;

      // 7. Calcular dados do ANO ATUAL (2026) - com projeções
      const employeeIdsWithProjection = new Set<string>();
      const plannedHireNames = new Set<string>();
      let currentFixedSalary = 0;
      let currentVariableSalary = 0;
      let currentBenefits = 0;

      // Contratações planejadas para 2026
      currentYearProjections?.filter(p => p.is_planned_hire).forEach(proj => {
        const key = proj.planned_employee_name || proj.id;
        if (!plannedHireNames.has(key)) {
          plannedHireNames.add(key);
        }
        currentFixedSalary += (proj.projected_fixed_salary || 0);
        currentVariableSalary += (proj.projected_variable_salary || 0);
        currentBenefits += (proj.projected_benefits || 0);
      });

      // Funcionários com projeções (mérito/promoção)
      const employeeProjectionsMap = new Map<string, typeof currentYearProjections>();
      currentYearProjections?.filter(p => !p.is_planned_hire && p.employee_id).forEach(proj => {
        const list = employeeProjectionsMap.get(proj.employee_id!) || [];
        list.push(proj);
        employeeProjectionsMap.set(proj.employee_id!, list);
      });

      employeeProjectionsMap.forEach((projList, empId) => {
        employeeIdsWithProjection.add(empId);
        const emp = employees.find(e => e.id === empId);
        
        if (emp) {
          let lastKnownSalary = emp.salary || 0;
          let lastKnownVariable = emp.variable_salary || 0;
          let lastKnownBenefits = emp.benefits_value || 0;
          
          for (let month = 1; month <= 12; month++) {
            const proj = projList.find(p => p.month === month);
            
            if (proj) {
              lastKnownSalary = proj.projected_fixed_salary;
              lastKnownVariable = proj.projected_variable_salary ?? lastKnownVariable;
              lastKnownBenefits = proj.projected_benefits ?? lastKnownBenefits;
            }
            
            let monthlySalary = lastKnownSalary;
            if (approvedAdjustments?.length && month >= approvedAdjustments[0].effective_month) {
              const percentage = approvedAdjustments[0].fixed_percentage || 0;
              monthlySalary = lastKnownSalary * (1 + percentage / 100);
            }
            
            currentFixedSalary += monthlySalary;
            currentVariableSalary += lastKnownVariable;
            currentBenefits += lastKnownBenefits;
          }
        }
      });

      // Funcionários sem projeção específica
      employees.forEach(emp => {
        if (!employeeIdsWithProjection.has(emp.id)) {
          const baseSalary = emp.salary || 0;
          const baseVariable = emp.variable_salary || 0;
          const baseBenefits = emp.benefits_value || 0;
          
          for (let month = 1; month <= 12; month++) {
            let monthlySalary = baseSalary;
            
            if (approvedAdjustments?.length && month >= approvedAdjustments[0].effective_month) {
              const percentage = approvedAdjustments[0].fixed_percentage || 0;
              monthlySalary = baseSalary * (1 + percentage / 100);
            }
            
            currentFixedSalary += monthlySalary;
            currentVariableSalary += baseVariable;
            currentBenefits += baseBenefits;
          }
        }
      });

      // 8. Preparar ajuste coletivo
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
      }

      const currentTotal = currentFixedSalary + currentVariableSalary + currentBenefits;
      const currentHeadcount = employees.length + plannedHireNames.size;

      // 9. Calcular variações 2025 vs 2026
      const fixedVariancePercent = previousFixedSalary > 0 
        ? ((currentFixedSalary - previousFixedSalary) / previousFixedSalary) * 100 
        : 0;
      const variableVariancePercent = previousVariableSalary > 0 
        ? ((currentVariableSalary - previousVariableSalary) / previousVariableSalary) * 100 
        : 0;
      const benefitsVariancePercent = previousBenefits > 0 
        ? ((currentBenefits - previousBenefits) / previousBenefits) * 100 
        : 0;
      const totalVariancePercent = previousTotal > 0 
        ? ((currentTotal - previousTotal) / previousTotal) * 100 
        : 0;
      const headcountVariancePercent = previousHeadcount > 0 
        ? ((currentHeadcount - previousHeadcount) / previousHeadcount) * 100 
        : 0;

      return {
        previousYear,
        currentYear,
        nextYear,
        previousFixedSalary,
        previousVariableSalary,
        previousBenefits,
        previousTotal,
        previousHeadcount,
        currentFixedSalary,
        currentVariableSalary,
        currentBenefits,
        currentTotal,
        currentHeadcount,
        fixedVariancePercent,
        variableVariancePercent,
        benefitsVariancePercent,
        totalVariancePercent,
        headcountVariancePercent,
        approvedAdjustment,
        hasCurrentYearApproved,
        hasNextYearPlanning,
        submissionStatus: currentSubmissionStatus,
        fiscalYear: currentYear,
      } as BudgetPlanningAnnualKPI;
    },
    staleTime: 2 * 60 * 1000,
  });
};
