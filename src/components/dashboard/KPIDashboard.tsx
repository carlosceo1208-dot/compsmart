import { Users, DollarSign, TrendingUp } from 'lucide-react';
import { KPICard } from '@/components/analytics/KPICard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Currency } from '@/types/economic';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { BenefitsCard } from './BenefitsCard';
import { IncentivesCard } from './IncentivesCard';
import { BudgetCard } from './BudgetCard';
import { HRMetricsCard } from './HRMetricsCard';
import { Badge } from '@/components/ui/badge';

interface KPIDashboardProps {
  currency: Currency;
  showWithCharges?: boolean;
}

export const KPIDashboard = ({ currency, showWithCharges = false }: KPIDashboardProps) => {
  const { convert } = useCurrencyConverter();
  const { socialChargesPercentage } = useCompanySettings();

  const { data: totalEmployees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['kpi-total-employees'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .not('employee_number', 'is', null);
      
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

  // Aplicar multiplicador de encargos se ativado
  const chargesMultiplier = showWithCharges && socialChargesPercentage > 0 
    ? (1 + socialChargesPercentage / 100) 
    : 1;

  const baseTotalSalary = salaryData ? convert(salaryData.total, 'BRL', currency) : 0;
  const baseAvgSalary = salaryData ? convert(salaryData.avg, 'BRL', currency) : 0;
  
  const totalSalary = baseTotalSalary * chargesMultiplier;
  const avgSalary = baseAvgSalary * chargesMultiplier;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">KPIs Principais</h3>
        {showWithCharges && socialChargesPercentage > 0 && (
          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
            Com encargos (+{socialChargesPercentage}%)
          </Badge>
        )}
      </div>
      
      <KPICard
        title="Colaboradores Ativos"
        value={totalEmployees}
        icon={Users}
        format="number"
        variant="success"
        isLoading={loadingEmployees}
      />
      
      <KPICard
        title={showWithCharges && socialChargesPercentage > 0 ? "Massa Salarial (c/ encargos)" : "Massa Salarial Total"}
        value={totalSalary}
        icon={DollarSign}
        format="compact-currency"
        variant="success"
        isLoading={loadingSalary}
        currency={currency}
      />
      
      <KPICard
        title={showWithCharges && socialChargesPercentage > 0 ? "Salário Médio (c/ encargos)" : "Salário Médio"}
        value={avgSalary}
        icon={TrendingUp}
        format="currency"
        variant="success"
        isLoading={loadingSalary}
        currency={currency}
      />
      
      <BenefitsCard currency={currency} />
      <IncentivesCard currency={currency} />
      <BudgetCard currency={currency} />
      <HRMetricsCard />
    </div>
  );
};