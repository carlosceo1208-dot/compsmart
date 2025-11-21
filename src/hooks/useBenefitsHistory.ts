import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, format, subMonths } from 'date-fns';

interface MonthlyBenefitCost {
  month: string;
  totalCost: number;
  companyCost: number;
  employeeCost: number;
  employeeCostPercentage: number;
  employeesCount: number;
}

export const useBenefitsHistory = (monthsBack: number = 12) => {
  return useQuery({
    queryKey: ['benefits-history', monthsBack],
    queryFn: async () => {
      // Buscar todos os benefícios atribuídos dos últimos X meses
      const startDate = startOfMonth(subMonths(new Date(), monthsBack));
      
      const { data: employeeBenefits, error } = await supabase
        .from('employee_benefits')
        .select(`
          company_contribution_value,
          employee_contribution_value,
          employee_contribution_type,
          employee_id,
          start_date,
          end_date,
          is_active,
          created_at
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Buscar funcionários ativos para validar
      const { data: activeEmployees, error: employeesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'active');
      
      if (employeesError) throw employeesError;

      const activeEmployeeIds = new Set(activeEmployees.map(e => e.id));

      // Agrupar por mês
      const monthlyData = new Map<string, {
        companyCost: number;
        employeeCost: number;
        employees: Set<string>;
      }>();

      // Inicializar todos os meses dos últimos X meses
      for (let i = 0; i < monthsBack; i++) {
        const month = format(subMonths(new Date(), monthsBack - i - 1), 'MMM/yy');
        monthlyData.set(month, {
          companyCost: 0,
          employeeCost: 0,
          employees: new Set(),
        });
      }

      // Processar benefícios
      employeeBenefits?.forEach((eb) => {
        // Verificar se o funcionário está ativo
        if (!activeEmployeeIds.has(eb.employee_id)) return;

        // Verificar se o benefício estava ativo no período
        const createdDate = new Date(eb.created_at);
        const monthKey = format(createdDate, 'MMM/yy');

        if (!monthlyData.has(monthKey)) return;

        const monthData = monthlyData.get(monthKey)!;
        
        // Adicionar custo da empresa
        monthData.companyCost += eb.company_contribution_value || 0;
        
        // Calcular custo do funcionário
        let empContribution = 0;
        if (eb.employee_contribution_type === 'percentage') {
          empContribution = (eb.company_contribution_value * (eb.employee_contribution_value || 0)) / 100;
        } else if (eb.employee_contribution_type === 'fixed') {
          empContribution = eb.employee_contribution_value || 0;
        }
        
        monthData.employeeCost += empContribution;
        monthData.employees.add(eb.employee_id);
      });

      // Converter para array final
      const history: MonthlyBenefitCost[] = Array.from(monthlyData.entries()).map(
        ([month, data]) => {
          const totalCost = data.companyCost + data.employeeCost;
          return {
            month,
            totalCost,
            companyCost: data.companyCost,
            employeeCost: data.employeeCost,
            employeeCostPercentage: totalCost > 0 ? (data.employeeCost / totalCost) * 100 : 0,
            employeesCount: data.employees.size,
          };
        }
      );

      return history;
    },
    staleTime: 5 * 60 * 1000,
  });
};
