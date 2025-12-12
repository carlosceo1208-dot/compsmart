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
  
  // Variações Totais
  salaryVariance: number;
  salaryVariancePercent: number;
  headcountVariance: number;
  headcountVariancePercent: number;
  
  // Variações por Categoria (em base comparável ano-a-ano)
  fixedVariancePercent: number;
  variableVariancePercent: number;
  benefitsVariancePercent: number;
  
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

      // 2. Calcular baseline do ano ATUAL - POR FUNCIONÁRIO baseado em hire_date
      let currentFixedSalary = 0;
      let currentVariableSalary = 0;
      let currentBenefits = 0;
      
      // Calcular meses trabalhados POR FUNCIONÁRIO com base na data de admissão
      currentEmployees.forEach(emp => {
        let monthsWorked = 12; // Padrão: 12 meses se admitido antes de Jan/2025
        
        if (emp.hire_date) {
          const hireDate = new Date(emp.hire_date);
          const hireYear = hireDate.getFullYear();
          const hireMonth = hireDate.getMonth() + 1; // 1-12
          
          if (hireYear === currentYear) {
            // Admitido no ano atual: calcular meses de Jan até mês atual
            // Ex: admitido em Nov/2025 e estamos em Dez/2025 = 2 meses
            monthsWorked = Math.max(1, currentMonth - hireMonth + 1);
          } else if (hireYear > currentYear) {
            // Admitido no futuro (não deveria acontecer, mas prevenir)
            monthsWorked = 0;
          }
          // Se hireYear < currentYear, mantém 12 meses (funcionário antigo)
        }
        
        currentFixedSalary += (emp.salary || 0) * monthsWorked;
        currentVariableSalary += (emp.variable_salary || 0) * monthsWorked;
        currentBenefits += (emp.benefits_value || 0) * monthsWorked;
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

      // Segundo: processar funcionários existentes COM projeções (mérito/promoção)
      // Agrupa todas as projeções por employee_id
      const employeeProjectionsMap = new Map<string, typeof projections>();
      projections?.filter(p => !p.is_planned_hire && p.employee_id).forEach(proj => {
        const list = employeeProjectionsMap.get(proj.employee_id!) || [];
        list.push(proj);
        employeeProjectionsMap.set(proj.employee_id!, list);
      });

      // Processar funcionários COM projeções usando carry forward mês a mês
      employeeProjectionsMap.forEach((projList, empId) => {
        employeeIdsWithProjection.add(empId);
        const emp = currentEmployees.find(e => e.id === empId);
        
        if (emp) {
          // Inicializar carry forward com valores atuais
          let lastKnownSalary = emp.salary || 0;
          let lastKnownVariable = emp.variable_salary || 0;
          let lastKnownBenefits = emp.benefits_value || 0;
          
          // Processar cada mês com carry forward
          for (let month = 1; month <= 12; month++) {
            const proj = projList.find(p => p.month === month);
            
            if (proj) {
              // Atualizar carry forward com valores da projeção (mérito individual)
              lastKnownSalary = proj.projected_fixed_salary;
              lastKnownVariable = proj.projected_variable_salary ?? lastKnownVariable;
              lastKnownBenefits = proj.projected_benefits ?? lastKnownBenefits;
            }
            
            // Aplicar ajuste coletivo se estiver no mês efetivo ou após
            let monthlySalary = lastKnownSalary;
            if (approvedAdjustments?.length && month >= approvedAdjustments[0].effective_month) {
              const percentage = approvedAdjustments[0].fixed_percentage || 0;
              monthlySalary = lastKnownSalary * (1 + percentage / 100);
            }
            
            projectedFixedSalary += monthlySalary;
            projectedVariableSalary += lastKnownVariable;
            projectedBenefits += lastKnownBenefits;
          }
        }
      });

      // Terceiro: adicionar baseline para funcionários SEM projeção específica
      // Também aplicar ajuste coletivo mês a mês
      currentEmployees.forEach(emp => {
        if (!employeeIdsWithProjection.has(emp.id)) {
          const baseSalary = emp.salary || 0;
          const baseVariable = emp.variable_salary || 0;
          const baseBenefits = emp.benefits_value || 0;
          
          for (let month = 1; month <= 12; month++) {
            let monthlySalary = baseSalary;
            
            // Aplicar ajuste coletivo a partir do mês efetivo
            if (approvedAdjustments?.length && month >= approvedAdjustments[0].effective_month) {
              const percentage = approvedAdjustments[0].fixed_percentage || 0;
              monthlySalary = baseSalary * (1 + percentage / 100);
            }
            
            projectedFixedSalary += monthlySalary;
            projectedVariableSalary += baseVariable;
            projectedBenefits += baseBenefits;
          }
        }
      });

      // 7. Preparar informações do ajuste coletivo para exibição (sem somar novamente)
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
        // NÃO somar annualCost aqui - já foi aplicado mês a mês acima
      }

      const projectedTotal = projectedFixedSalary + projectedVariableSalary + projectedBenefits;
      const projectedHeadcount = currentHeadcount + plannedHireNames.size;

      // 8. Calcular variações por comparação direta simples (2025 vs 2026)
      const fixedVariancePercent = currentFixedSalary > 0 
        ? ((projectedFixedSalary - currentFixedSalary) / currentFixedSalary) * 100 
        : 0;
      const variableVariancePercent = currentVariableSalary > 0 
        ? ((projectedVariableSalary - currentVariableSalary) / currentVariableSalary) * 100 
        : 0;
      const benefitsVariancePercent = currentBenefits > 0 
        ? ((projectedBenefits - currentBenefits) / currentBenefits) * 100 
        : 0;
      
      const salaryVariance = projectedTotal - currentTotal;
      const salaryVariancePercent = currentTotal > 0 
        ? (salaryVariance / currentTotal) * 100 
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
        currentFixedSalary,      // Valor proporcional real (meses trabalhados)
        currentVariableSalary,   // Valor proporcional real
        currentBenefits,         // Valor proporcional real
        currentTotal,            // Valor proporcional real
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
        fixedVariancePercent,
        variableVariancePercent,
        benefitsVariancePercent,
        approvedAdjustment,
        hasPlanning,
        submissionStatus,
        fiscalYear: nextYear,
      } as BudgetPlanningAnnualKPI;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};
