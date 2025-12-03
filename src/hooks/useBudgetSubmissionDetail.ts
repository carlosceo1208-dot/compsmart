import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Alert {
  type: string;
  employee: string;
  message: string;
}

interface EmployeeChange {
  employee: any;
  changes: any[];
  totalImpact: number;
  changeType: string; // merit_increase, adjustment, promotion, transfer, other
}

export const useBudgetSubmissionDetail = (submissionId: string | null) => {
  return useQuery({
    queryKey: ['budget-submission-detail', submissionId],
    queryFn: async () => {
      if (!submissionId) return null;

      // Buscar submissão
      const { data: submission, error: submissionError } = await supabase
        .from('budget_submissions')
        .select(`
          *,
          unit:organizational_structure(id, code, description)
        `)
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;

      // Buscar projeções - condicional por unidade
      let projectionsQuery = supabase
        .from('budget_employee_projections')
        .select(`
          *,
          employee:profiles!budget_employee_projections_employee_id_fkey(id, full_name, job_title, grade, salary, job_title_id),
          projected_job_title:job_titles(title, grade, salary_range_id),
          projected_unit:organizational_structure(description)
        `)
        .eq('fiscal_year', submission.fiscal_year)
        .eq('is_active', true);

      // CORREÇÃO: Se unit_id for null (empresa toda), buscar TODAS as projeções
      if (submission.unit_id) {
        projectionsQuery = projectionsQuery.eq('projected_unit_id', submission.unit_id);
      }
      // Se unit_id for null, não filtra por unidade (traz todas)

      const { data: projections, error: projectionsError } = await projectionsQuery.order('employee_id');

      if (projectionsError) throw projectionsError;

      // Separar contratações planejadas de funcionários existentes
      const plannedHires = projections?.filter(p => p.is_planned_hire) || [];
      const employeeProjections = projections?.filter(p => !p.is_planned_hire) || [];

      // Agrupar contratações planejadas por nome (cada nome = 1 contratação)
      const uniquePlannedHires = Array.from(
        new Map(plannedHires.map(h => [h.planned_employee_name, h])).values()
      );

      // Agrupar funcionários existentes com alterações
      const employeeChanges: EmployeeChange[] = [];
      const employeeMap = new Map<string, EmployeeChange>();
      
      employeeProjections?.forEach(proj => {
        const empId = proj.employee_id;
        if (!empId) return;
        
        if (!employeeMap.has(empId)) {
          employeeMap.set(empId, {
            employee: proj.employee,
            changes: [],
            totalImpact: 0,
            changeType: proj.change_type || 'other',
          });
        }
        const empData = employeeMap.get(empId)!;
        empData.changes.push(proj);
        const currentSalary = proj.employee?.salary || 0;
        empData.totalImpact += (proj.projected_fixed_salary - currentSalary) * (13 - proj.month);
      });

      // Converter para array e categorizar
      employeeMap.forEach((value) => employeeChanges.push(value));

      // Separar por categoria
      const salaryChanges = employeeChanges.filter(e => 
        ['merit_increase', 'adjustment', 'other', null, undefined].includes(e.changeType) &&
        e.changeType !== 'promotion'
      );
      const promotions = employeeChanges.filter(e => e.changeType === 'promotion');

      // Calcular totais mensais (12 meses)
      const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthProjections = projections?.filter(p => p.month === month) || [];
        
        return {
          month,
          totalFixed: monthProjections.reduce((sum, p) => sum + (p.projected_fixed_salary || 0), 0),
          totalVariable: monthProjections.reduce((sum, p) => sum + (p.projected_variable_salary || 0), 0),
          totalBenefits: monthProjections.reduce((sum, p) => sum + (p.projected_benefits || 0), 0),
          headcount: new Set(monthProjections.map(p => p.employee_id || p.planned_employee_name)).size,
        };
      });

      return {
        submission,
        employeeChanges, // Mantém para compatibilidade (todos)
        salaryChanges,   // Aumentos salariais (mérito, enquadramento, outro)
        promotions,      // Promoções de cargo
        plannedHires: uniquePlannedHires,
        monthlyTotals,
        alerts: generateAlerts(projections),
      };
    },
    enabled: !!submissionId,
  });
};

// Função auxiliar para gerar alertas automáticos - CORRIGIDA para evitar duplicatas
function generateAlerts(projections: any[]): Alert[] {
  const alerts: Alert[] = [];
  const processedEmployees = new Set<string>();
  const processedHires = new Set<string>();
  
  projections?.forEach(proj => {
    // Alerta único por funcionário (não por mês)
    if (!proj.is_planned_hire && proj.employee_id && !processedEmployees.has(proj.employee_id)) {
      processedEmployees.add(proj.employee_id);
      const currentSalary = proj.employee?.salary || 0;
      if (currentSalary > 0) {
        const increase = ((proj.projected_fixed_salary - currentSalary) / currentSalary) * 100;
        if (increase > 20) {
          alerts.push({
            type: 'warning',
            employee: proj.employee?.full_name || 'N/A',
            message: `Aumento de ${increase.toFixed(1)}% (acima de 20%)`,
          });
        }
      }
    }
    
    // Alerta: Contratação planejada (uma vez por nome)
    if (proj.is_planned_hire && proj.planned_employee_name && !processedHires.has(proj.planned_employee_name)) {
      processedHires.add(proj.planned_employee_name);
      alerts.push({
        type: 'info',
        employee: proj.planned_employee_name,
        message: `Contratação planejada para ${getMonthName(proj.month)}`,
      });
    }
  });
  
  return alerts;
}

function getMonthName(month: number): string {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return months[month - 1] || `Mês ${month}`;
}
