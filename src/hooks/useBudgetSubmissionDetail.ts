import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Alert {
  type: string;
  employee: string;
  message: string;
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

      // Buscar projeções agrupadas por funcionário
      const { data: projections, error: projectionsError } = await supabase
        .from('budget_employee_projections')
        .select(`
          *,
          employee:profiles!budget_employee_projections_employee_id_fkey(id, full_name, job_title, grade, salary),
          projected_job_title:job_titles(title, grade, salary_range_id),
          projected_unit:organizational_structure(description)
        `)
        .eq('fiscal_year', submission.fiscal_year)
        .eq('projected_unit_id', submission.unit_id)
        .eq('is_active', true)
        .order('employee_id');

      if (projectionsError) throw projectionsError;

      // Agrupar por funcionário
      const employeeChanges = new Map();
      projections?.forEach(proj => {
        const empId = proj.employee_id || `planned_hire_${proj.planned_employee_name}`;
        if (!employeeChanges.has(empId)) {
          employeeChanges.set(empId, {
            employee: proj.employee || { full_name: proj.planned_employee_name || 'Contratação Planejada' },
            changes: [],
            totalImpact: 0,
          });
        }
        const empData = employeeChanges.get(empId);
        empData.changes.push(proj);
        const currentSalary = proj.employee?.salary || 0;
        empData.totalImpact += (proj.projected_fixed_salary - currentSalary) * (13 - proj.month);
      });

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
        employeeChanges: Array.from(employeeChanges.values()),
        monthlyTotals,
        alerts: generateAlerts(projections),
      };
    },
    enabled: !!submissionId,
  });
};

// Função auxiliar para gerar alertas automáticos
function generateAlerts(projections: any[]): Alert[] {
  const alerts: Alert[] = [];
  
  projections?.forEach(proj => {
    // Alerta: Aumento acima de 20%
    const currentSalary = proj.employee?.salary || 0;
    if (currentSalary > 0) {
      const increase = ((proj.projected_fixed_salary - currentSalary) / currentSalary) * 100;
      if (increase > 20) {
        alerts.push({
          type: 'warning',
          employee: proj.employee?.full_name || proj.planned_employee_name || 'N/A',
          message: `Aumento de ${increase.toFixed(1)}% (acima de 20%)`,
        });
      }
    }
    
    // Alerta: Contratação planejada
    if (proj.is_planned_hire) {
      alerts.push({
        type: 'info',
        employee: proj.planned_employee_name || 'Novo funcionário',
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
