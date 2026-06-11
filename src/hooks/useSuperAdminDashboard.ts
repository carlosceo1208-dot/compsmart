import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRole } from './useCurrentUserRole';
import { differenceInMonths } from 'date-fns';

interface CompanyData {
  id: string;
  name: string;
  fantasy_name: string | null;
  industry_sector: string | null;
  subscription_status: string | null;
  subscription_plan_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
  logo_url: string | null;
  employee_count: number;
  avg_tenure_months: number;
  plan_name: string | null;
  monthly_price: number;
}

interface DashboardMetrics {
  totalCompanies: number;
  totalEmployees: number;
  estimatedMRR: number;
  trialConversionRate: number;
  companiesBySize: { name: string; value: number }[];
  companiesByPlan: { name: string; value: number }[];
  companiesBySector: { name: string; value: number }[];
  avgTenureMonths: number;
  companies: CompanyData[];
}

export const useSuperAdminDashboard = () => {
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();

  return useQuery({
    queryKey: ['super-admin-dashboard'],
    queryFn: async (): Promise<DashboardMetrics> => {
      // Fetch all companies (root_company_id IS NULL means it's a root company)
      const { data: companies, error: companiesError } = await supabase
        .from('organizational_structure')
        .select(`
          id,
          name,
          fantasy_name,
          industry_sector,
          subscription_status,
          subscription_plan_id,
          trial_ends_at,
          created_at,
          logo_url,
          subscription_plans (
            name,
            monthly_price
          )
        `)
        .eq('type', 'company');

      if (companiesError) throw companiesError;

      // Fetch all active employees with hire_date
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('id, root_company_id, hire_date, status')
        .eq('status', 'active');

      if (employeesError) throw employeesError;

      // Calculate metrics per company
      const now = new Date();
      const companyDataList: CompanyData[] = companies?.map(company => {
        const companyEmployees = employees?.filter(e => e.root_company_id === company.id) || [];
        const employeeCount = companyEmployees.length;

        // Calculate average tenure
        const tenures = companyEmployees
          .filter(e => e.hire_date)
          .map(e => differenceInMonths(now, new Date(e.hire_date!)));
        
        const avgTenureMonths = tenures.length > 0 
          ? tenures.reduce((a, b) => a + b, 0) / tenures.length 
          : 0;

        const planData = company.subscription_plans as { name: string; monthly_price: number } | null;

        return {
          id: company.id,
          name: company.name,
          fantasy_name: company.fantasy_name,
          industry_sector: company.industry_sector,
          subscription_status: company.subscription_status,
          subscription_plan_id: company.subscription_plan_id,
          trial_ends_at: company.trial_ends_at,
          created_at: company.created_at,
          logo_url: company.logo_url,
          employee_count: employeeCount,
          avg_tenure_months: avgTenureMonths,
          plan_name: planData?.name || null,
          monthly_price: planData?.monthly_price || 0,
        };
      }) || [];

      // KPIs
      const totalCompanies = companyDataList.length;
      const totalEmployees = employees?.length || 0;

      // MRR calculation
      const activeCompanies = companyDataList.filter(c => c.subscription_status === 'active');
      const estimatedMRR = activeCompanies.reduce((sum, c) => sum + (c.monthly_price || 0), 0);

      // Trial conversion rate
      const trialCompanies = companyDataList.filter(c => c.subscription_status === 'trial').length;
      const convertedCompanies = activeCompanies.length;
      const totalTrialPlusActive = trialCompanies + convertedCompanies;
      const trialConversionRate = totalTrialPlusActive > 0 
        ? (convertedCompanies / totalTrialPlusActive) * 100 
        : 0;

      // Distribution by company size
      const small = companyDataList.filter(c => c.employee_count < 100).length;
      const medium = companyDataList.filter(c => c.employee_count >= 100 && c.employee_count < 500).length;
      const large = companyDataList.filter(c => c.employee_count >= 500).length;
      
      const companiesBySize = [
        { name: 'Pequena (até 99)', value: small },
        { name: 'Média (100-499)', value: medium },
        { name: 'Grande (500+)', value: large },
      ];

      // Distribution by plan
      const planCounts: Record<string, number> = {};
      companyDataList.forEach(c => {
        const plan = c.subscription_status === 'trial' ? 'Trial' : (c.plan_name || 'Sem plano');
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });
      const companiesByPlan = Object.entries(planCounts).map(([name, value]) => ({ name, value }));

      // Distribution by sector
      const sectorCounts: Record<string, number> = {};
      companyDataList.forEach(c => {
        const sector = c.industry_sector || 'Não informado';
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      });
      const companiesBySector = Object.entries(sectorCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Average tenure across all employees
      const allTenures = employees
        ?.filter(e => e.hire_date)
        .map(e => differenceInMonths(now, new Date(e.hire_date!))) || [];
      
      const avgTenureMonths = allTenures.length > 0 
        ? allTenures.reduce((a, b) => a + b, 0) / allTenures.length 
        : 0;

      return {
        totalCompanies,
        totalEmployees,
        estimatedMRR,
        trialConversionRate,
        companiesBySize,
        companiesByPlan,
        companiesBySector,
        avgTenureMonths,
        companies: companyDataList,
      };
    },
    enabled: roleData?.isSuperAdmin === true,
  });
};
