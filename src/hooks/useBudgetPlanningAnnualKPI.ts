import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

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

  // Comparação 2026 (Orçado vs Atual)
  currentBudgetedFixedSalary: number;
  currentBudgetedVariableSalary: number;
  currentBudgetedBenefits: number;
  currentBudgetedTotal: number;
  currentBudgetedHeadcount: number;

  currentActualFixedSalary: number;
  currentActualVariableSalary: number;
  currentActualBenefits: number;
  currentActualTotal: number;
  currentActualHeadcount: number;

  unplannedHires?: Array<{
    id: string;
    fullName: string;
    hireDate: string | null;
    annualFixed: number;
    annualVariable: number;
    annualBenefits: number;
    annualTotal: number;
  }>;
  
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
  const { activeCompanyId } = useCompanyContext();
  const currentYear = new Date().getFullYear();  // 2026
  const previousYear = currentYear - 1;           // 2025
  const nextYear = currentYear + 1;               // 2027

  const startOfYearISO = (year: number) => `${year}-01-01`;
  const endOfYearISO = (year: number) => `${year}-12-31`;

  const getYearMonthFromDate = (date: string | null | undefined) => {
    if (!date) return null;
    // date vem do backend como DATE (YYYY-MM-DD). Evitar Date() por timezone.
    const [y, m] = date.split('-');
    const year = Number(y);
    const month = Number(m);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
    return { year, month };
  };

  const monthsWorkedInYear = (
    hireDate: string | null | undefined,
    terminationDate: string | null | undefined,
    year: number
  ) => {
    // Regra (mês calendário, inclusivo):
    // início = max(hire_date, 01/01/ano)
    // fim = min(termination_date (se existir), 31/12/ano)
    // meses = fimMes - inicioMes + 1
    const start = getYearMonthFromDate(hireDate) ?? getYearMonthFromDate(startOfYearISO(year));
    const end = getYearMonthFromDate(terminationDate) ?? getYearMonthFromDate(endOfYearISO(year));

    if (!start || !end) return 12;

    // Clamp
    const startClamped = start.year < year ? { year, month: 1 } : start.year > year ? { year, month: 13 } : start;
    const endClamped = end.year > year ? { year, month: 12 } : end.year < year ? { year, month: 0 } : end;

    if (startClamped.month > 12 || endClamped.month < 1) return 0;
    if (startClamped.month > endClamped.month) return 0;

    return Math.max(0, endClamped.month - startClamped.month + 1);
  };

  const isActiveOnDate = (
    hireDate: string | null | undefined,
    terminationDate: string | null | undefined,
    dateISO: string
  ) => {
    if (!hireDate) return true;
    // Comparação lexicográfica funciona para ISO (YYYY-MM-DD)
    const hired = hireDate <= dateISO;
    const notTerminated = !terminationDate || terminationDate > dateISO;
    return hired && notTerminated;
  };

  return useQuery({
    queryKey: ['budget-planning-annual-kpi', activeCompanyId, previousYear, currentYear, nextYear],
    queryFn: async () => {
      // 1. Buscar funcionários relevantes para baseline (ano anterior) e ano atual
      // Inclui desligados que trabalharam em qualquer parte do período (evita subestimar "Atual" e baseline).
      let employeesQuery = supabase
        .from('profiles')
        .select('id, full_name, salary, variable_salary, benefits_value, hire_date, termination_date')
        .not('salary', 'is', null);

      // Escopo por empresa ativa (segurança + consistência de números)
      if (activeCompanyId) {
        employeesQuery = employeesQuery.eq('root_company_id', activeCompanyId);
      }

      // Trabalhou em baseline ou em ano atual
      employeesQuery = employeesQuery
        .lte('hire_date', endOfYearISO(currentYear))
        .or(`termination_date.is.null,termination_date.gte.${startOfYearISO(previousYear)}`);

      const { data: employees, error: employeesError } = await employeesQuery;

      if (employeesError) throw employeesError;

      // 2. Calcular dados do ANO ANTERIOR (2025) - baseline para comparação
      let previousFixedSalary = 0;
      let previousVariableSalary = 0;
      let previousBenefits = 0;
      
      employees.forEach(emp => {
        const monthsWorked = monthsWorkedInYear(emp.hire_date, emp.termination_date, previousYear);
        
        previousFixedSalary += (emp.salary || 0) * monthsWorked;
        previousVariableSalary += (emp.variable_salary || 0) * monthsWorked;
        previousBenefits += (emp.benefits_value || 0) * monthsWorked;
      });

      const previousTotal = previousFixedSalary + previousVariableSalary + previousBenefits;
      const previousHeadcount = employees.filter((emp) =>
        isActiveOnDate(emp.hire_date, emp.termination_date, endOfYearISO(previousYear))
      ).length;

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
      const employeeIdsInBudget = new Set<string>();
      const plannedHireNames = new Set<string>();
      let budgetedFixedSalary = 0;
      let budgetedVariableSalary = 0;
      let budgetedBenefits = 0;

      // Contratações planejadas para 2026
      currentYearProjections?.filter(p => p.is_planned_hire).forEach(proj => {
        const key = proj.planned_employee_name || proj.id;
        if (!plannedHireNames.has(key)) {
          plannedHireNames.add(key);
        }
        budgetedFixedSalary += (proj.projected_fixed_salary || 0);
        budgetedVariableSalary += (proj.projected_variable_salary || 0);
        budgetedBenefits += (proj.projected_benefits || 0);
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
        employeeIdsInBudget.add(empId);
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
            
            budgetedFixedSalary += monthlySalary;
            budgetedVariableSalary += lastKnownVariable;
            budgetedBenefits += lastKnownBenefits;
          }
        }
      });

      // Funcionários sem projeção específica
      employees.forEach(emp => {
        if (!employeeIdsWithProjection.has(emp.id)) {
          // Regras para incluir no ORÇADO:
          // - quem já estava no ano anterior (baseline), ou
          // - quem tem projeção explícita (já tratado acima)
          // (evita contar admissões em 2026 que não existiam no orçamento aprovado)
          const hireYM = getYearMonthFromDate(emp.hire_date);
          const isBaselineEmployee = !hireYM ? true : hireYM.year <= previousYear;
          if (!isBaselineEmployee) {
            return;
          }

          employeeIdsInBudget.add(emp.id);
          const baseSalary = emp.salary || 0;
          const baseVariable = emp.variable_salary || 0;
          const baseBenefits = emp.benefits_value || 0;
          
          for (let month = 1; month <= 12; month++) {
            let monthlySalary = baseSalary;
            
            if (approvedAdjustments?.length && month >= approvedAdjustments[0].effective_month) {
              const percentage = approvedAdjustments[0].fixed_percentage || 0;
              monthlySalary = baseSalary * (1 + percentage / 100);
            }
            
            budgetedFixedSalary += monthlySalary;
            budgetedVariableSalary += baseVariable;
            budgetedBenefits += baseBenefits;
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

      // 7.1) Calcular ATUAL (real) para 2026 (annualizado por meses trabalhados em 2026)
      let actualFixedSalary = 0;
      let actualVariableSalary = 0;
      let actualBenefits = 0;

      const unplannedHires = employees
        .filter((emp) => {
          const ym = getYearMonthFromDate(emp.hire_date);
          if (!ym) return false;
          return ym.year === currentYear && !employeeIdsInBudget.has(emp.id);
        })
        .map((emp) => {
          const monthsWorked = monthsWorkedInYear(emp.hire_date, emp.termination_date, currentYear);
          const annualFixed = (emp.salary || 0) * monthsWorked;
          const annualVariable = (emp.variable_salary || 0) * monthsWorked;
          const annualBenefits = (emp.benefits_value || 0) * monthsWorked;
          return {
            id: emp.id,
            fullName: emp.full_name || 'Sem nome',
            hireDate: emp.hire_date,
            annualFixed,
            annualVariable,
            annualBenefits,
            annualTotal: annualFixed + annualVariable + annualBenefits,
          };
        });

      employees.forEach((emp) => {
        const monthsWorked = monthsWorkedInYear(emp.hire_date, emp.termination_date, currentYear);
        actualFixedSalary += (emp.salary || 0) * monthsWorked;
        actualVariableSalary += (emp.variable_salary || 0) * monthsWorked;
        actualBenefits += (emp.benefits_value || 0) * monthsWorked;
      });

      const currentBudgetedFixedSalary = budgetedFixedSalary;
      const currentBudgetedVariableSalary = budgetedVariableSalary;
      const currentBudgetedBenefits = budgetedBenefits;
      const currentBudgetedTotal = currentBudgetedFixedSalary + currentBudgetedVariableSalary + currentBudgetedBenefits;
      const currentBudgetedHeadcount = employeeIdsInBudget.size + plannedHireNames.size;

      const currentActualFixedSalary = actualFixedSalary;
      const currentActualVariableSalary = actualVariableSalary;
      const currentActualBenefits = actualBenefits;
      const currentActualTotal = currentActualFixedSalary + currentActualVariableSalary + currentActualBenefits;
      // "2026 Atual" = posição em 31/12/2026 (headcount em 31/12)
      const currentActualHeadcount = employees.filter((emp) =>
        isActiveOnDate(emp.hire_date, emp.termination_date, endOfYearISO(currentYear))
      ).length;

      // Mantemos campos atuais (compatibilidade) apontando para o ORÇADO (aprovado)
      const currentFixedSalary = currentBudgetedFixedSalary;
      const currentVariableSalary = currentBudgetedVariableSalary;
      const currentBenefits = currentBudgetedBenefits;
      const currentTotal = currentBudgetedTotal;
      const currentHeadcount = currentBudgetedHeadcount;

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

        currentBudgetedFixedSalary,
        currentBudgetedVariableSalary,
        currentBudgetedBenefits,
        currentBudgetedTotal,
        currentBudgetedHeadcount,

        currentActualFixedSalary,
        currentActualVariableSalary,
        currentActualBenefits,
        currentActualTotal,
        currentActualHeadcount,

        unplannedHires,
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
