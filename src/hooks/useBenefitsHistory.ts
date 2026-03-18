import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, addMonths, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyBenefitCost {
  month: string;
  totalCost: number;
  companyCost: number;
  employeeCost: number;
  employeeCostPercentage: number;
  employeesCount: number;
}

// Data de fundação da CompSmart - Novembro de 2025
const COMPSMART_FOUNDATION_DATE = new Date(2025, 10, 1); // Mês 10 = Novembro (0-indexed)

export const useBenefitsHistory = (monthsBack: number = 12) => {
  return useQuery({
    queryKey: ['benefits-history', monthsBack],
    queryFn: async () => {
      const today = new Date();
      
      // Calcular quantos meses desde a fundação da CompSmart
      const monthsSinceFoundation = differenceInMonths(today, COMPSMART_FOUNDATION_DATE) + 1;
      const effectiveMonthsBack = Math.min(monthsBack, monthsSinceFoundation);
      
      // Buscar TODOS os benefícios atribuídos (sem filtro de data de criação)
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
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Buscar funcionários ativos para validar
      const { data: activeEmployees, error: employeesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'active')
        .not('employee_number', 'is', null);
      
      if (employeesError) throw employeesError;

      const activeEmployeeIds = new Set(activeEmployees.map(e => e.id));

      // Agrupar por mês - estrutura para armazenar dados mensais
      const monthlyData = new Map<string, {
        monthStart: Date;
        monthEnd: Date;
        companyCost: number;
        employeeCost: number;
        employees: Set<string>;
      }>();

      // Inicializar meses desde Nov/2025 até o mês atual
      for (let i = 0; i < effectiveMonthsBack; i++) {
        const monthDate = addMonths(COMPSMART_FOUNDATION_DATE, i);
        if (monthDate <= today) {
          const monthKey = format(monthDate, 'MMM/yy', { locale: ptBR });
          monthlyData.set(monthKey, {
            monthStart: startOfMonth(monthDate),
            monthEnd: endOfMonth(monthDate),
            companyCost: 0,
            employeeCost: 0,
            employees: new Set(),
          });
        }
      }

      // Processar benefícios - verificar se estava ATIVO em cada mês
      employeeBenefits?.forEach((eb) => {
        // Verificar se o funcionário está ativo
        if (!activeEmployeeIds.has(eb.employee_id)) return;
        
        // Verificar se o benefício está ativo
        if (!eb.is_active) return;

        // Data de início do benefício (usar created_at como fallback)
        const benefitStartDate = eb.start_date 
          ? new Date(eb.start_date) 
          : new Date(eb.created_at);
        
        // Data de fim do benefício (null = ainda ativo)
        const benefitEndDate = eb.end_date ? new Date(eb.end_date) : null;

        // Para cada mês, verificar se o benefício estava ativo
        monthlyData.forEach((monthData, monthKey) => {
          // Verificar se o benefício estava ativo neste mês:
          // - Benefício começou antes ou durante o mês
          // - Benefício terminou depois do início do mês OU ainda está ativo
          const benefitStartedBeforeMonthEnd = benefitStartDate <= monthData.monthEnd;
          const benefitActiveInMonth = !benefitEndDate || benefitEndDate >= monthData.monthStart;

          if (benefitStartedBeforeMonthEnd && benefitActiveInMonth) {
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
          }
        });
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
