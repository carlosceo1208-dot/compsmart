import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, format, subMonths } from 'date-fns';

interface MonthlyUnitBenefitCost {
  month: string;
  totalCost: number;
  companyCost: number;
  employeeCost: number;
  employeeCostPercentage: number;
  employeesCount: number;
  benefitsCount: number;
  avgCostPerEmployee: number;
}

export interface UnitBenefitsHistory {
  unitId: string;
  unitName: string;
  unitType: string;
  unitCode: string | null;
  history: MonthlyUnitBenefitCost[];
  summary: {
    avgMonthlyCost: number;
    trendPercentage: number;
    rank: number;
  };
}

interface UseBenefitsHistoryByUnitParams {
  monthsBack?: number;
  unitType?: string | null;
  selectedUnitIds?: string[];
}

export const useBenefitsHistoryByUnit = ({
  monthsBack = 12,
  unitType = null,
  selectedUnitIds = [],
}: UseBenefitsHistoryByUnitParams = {}) => {
  return useQuery({
    queryKey: ['benefits-history-by-unit', monthsBack, unitType, selectedUnitIds],
    queryFn: async () => {
      const startDate = startOfMonth(subMonths(new Date(), monthsBack));

      // Buscar unidades organizacionais
      let unitsQuery = supabase
        .from('organizational_structure')
        .select('id, name, type, code, description')
        .in('type', ['area', 'department', 'sector', 'project'])
        .order('name');

      if (unitType) {
        unitsQuery = unitsQuery.eq('type', unitType);
      }

      if (selectedUnitIds.length > 0) {
        unitsQuery = unitsQuery.in('id', selectedUnitIds);
      }

      const { data: units, error: unitsError } = await unitsQuery;
      if (unitsError) throw unitsError;
      if (!units || units.length === 0) return [];

      // Buscar todos os funcionários ativos com seus benefícios
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('id, unit_id, full_name')
        .eq('status', 'active')
        .in('unit_id', units.map(u => u.id));

      if (employeesError) throw employeesError;

      // Criar mapa de funcionários por unidade
      const employeesByUnit = new Map<string, string[]>();
      employees?.forEach((emp) => {
        if (emp.unit_id) {
          if (!employeesByUnit.has(emp.unit_id)) {
            employeesByUnit.set(emp.unit_id, []);
          }
          employeesByUnit.get(emp.unit_id)!.push(emp.id);
        }
      });

      // Buscar benefícios dos funcionários
      const allEmployeeIds = employees?.map(e => e.id) || [];
      if (allEmployeeIds.length === 0) return [];

      const { data: employeeBenefits, error: benefitsError } = await supabase
        .from('employee_benefits')
        .select(`
          employee_id,
          company_contribution_value,
          employee_contribution_value,
          employee_contribution_type,
          created_at,
          is_active
        `)
        .in('employee_id', allEmployeeIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (benefitsError) throw benefitsError;

      // Processar dados por unidade
      const unitsHistory: UnitBenefitsHistory[] = [];

      for (const unit of units) {
        const unitEmployees = employeesByUnit.get(unit.id) || [];
        if (unitEmployees.length === 0) continue;

        // Agrupar benefícios por mês
        const monthlyData = new Map<string, {
          companyCost: number;
          employeeCost: number;
          employees: Set<string>;
          benefits: Set<string>;
        }>();

        // Inicializar todos os meses
        for (let i = 0; i < monthsBack; i++) {
          const month = format(subMonths(new Date(), monthsBack - i - 1), 'MMM/yy');
          monthlyData.set(month, {
            companyCost: 0,
            employeeCost: 0,
            employees: new Set(),
            benefits: new Set(),
          });
        }

        // Processar benefícios da unidade
        employeeBenefits?.forEach((eb) => {
          if (!unitEmployees.includes(eb.employee_id)) return;

          const createdDate = new Date(eb.created_at);
          const monthKey = format(createdDate, 'MMM/yy');

          if (!monthlyData.has(monthKey)) return;

          const monthData = monthlyData.get(monthKey)!;

          monthData.companyCost += eb.company_contribution_value || 0;

          let empContribution = 0;
          if (eb.employee_contribution_type === 'percentage') {
            empContribution = (eb.company_contribution_value * (eb.employee_contribution_value || 0)) / 100;
          } else if (eb.employee_contribution_type === 'fixed') {
            empContribution = eb.employee_contribution_value || 0;
          }

          monthData.employeeCost += empContribution;
          monthData.employees.add(eb.employee_id);
          monthData.benefits.add(`${eb.employee_id}-benefit`);
        });

        // Converter para array de histórico
        const history: MonthlyUnitBenefitCost[] = Array.from(monthlyData.entries()).map(
          ([month, data]) => {
            const totalCost = data.companyCost + data.employeeCost;
            const employeesCount = data.employees.size;
            return {
              month,
              totalCost,
              companyCost: data.companyCost,
              employeeCost: data.employeeCost,
              employeeCostPercentage: totalCost > 0 ? (data.employeeCost / totalCost) * 100 : 0,
              employeesCount,
              benefitsCount: data.benefits.size,
              avgCostPerEmployee: employeesCount > 0 ? totalCost / employeesCount : 0,
            };
          }
        );

        // Calcular sumário
        const avgMonthlyCost = history.reduce((sum, h) => sum + h.totalCost, 0) / history.length;
        const lastThreeMonths = history.slice(-3);
        const previousThreeMonths = history.slice(-6, -3);
        const lastAvg = lastThreeMonths.reduce((sum, h) => sum + h.totalCost, 0) / 3;
        const prevAvg = previousThreeMonths.reduce((sum, h) => sum + h.totalCost, 0) / 3;
        const trendPercentage = prevAvg > 0 ? ((lastAvg - prevAvg) / prevAvg) * 100 : 0;

        unitsHistory.push({
          unitId: unit.id,
          unitName: unit.name,
          unitType: unit.type,
          unitCode: unit.code,
          history,
          summary: {
            avgMonthlyCost,
            trendPercentage,
            rank: 0, // Será calculado depois
          },
        });
      }

      // Calcular rankings
      const sortedByAvgCost = [...unitsHistory].sort((a, b) => b.summary.avgMonthlyCost - a.summary.avgMonthlyCost);
      sortedByAvgCost.forEach((unit, index) => {
        const originalUnit = unitsHistory.find(u => u.unitId === unit.unitId);
        if (originalUnit) {
          originalUnit.summary.rank = index + 1;
        }
      });

      return unitsHistory;
    },
    staleTime: 5 * 60 * 1000,
  });
};
