import { Users, DollarSign, TrendingUp } from 'lucide-react';
import { KPICard } from '@/components/analytics/KPICard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Currency } from '@/types/economic';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { BenefitsCard } from './BenefitsCard';
import { IncentivesCard } from './IncentivesCard';
import { BudgetCard } from './BudgetCard';

interface KPIDashboardProps {
  currency: Currency;
}

export const KPIDashboard = ({ currency }: KPIDashboardProps) => {
  const { convert } = useCurrencyConverter();

  const { data: totalEmployees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['kpi-total-employees'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: salaryData, isLoading: loadingSalary } = useQuery({
    queryKey: ['kpi-salary-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('salary')
        .eq('status', 'active')
        .not('salary', 'is', null);
      
      if (error) throw error;
      
      const salaries = data.map(p => p.salary || 0);
      const total = salaries.reduce((sum, s) => sum + s, 0);
      const avg = salaries.length > 0 ? total / salaries.length : 0;
      
      return { total, avg };
    },
    staleTime: 5 * 60 * 1000,
  });

  const totalSalary = salaryData ? convert(salaryData.total, 'BRL', currency) : 0;
  const avgSalary = salaryData ? convert(salaryData.avg, 'BRL', currency) : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">KPIs Principais</h3>
      
      <KPICard
        title="Funcionários Ativos"
        value={totalEmployees}
        icon={Users}
        format="number"
        isLoading={loadingEmployees}
      />
      
      <KPICard
        title="Massa Salarial Total"
        value={totalSalary}
        icon={DollarSign}
        format="compact-currency"
        isLoading={loadingSalary}
      />
      
      <KPICard
        title="Média Salarial"
        value={avgSalary}
        icon={TrendingUp}
        format="currency"
        isLoading={loadingSalary}
      />
      
      <BenefitsCard currency={currency} />
      <IncentivesCard currency={currency} />
      <BudgetCard currency={currency} />
    </div>
  );
};
