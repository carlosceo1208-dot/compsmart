import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

interface Company {
  id: string;
  name: string;
  fantasy_name: string | null;
  logo_url: string | null;
  subscription_status: string | null;
  subscription_plan_id: string | null;
  planName?: string;
  employeeCount?: number;
}

interface CompanyContextType {
  activeCompanyId: string | null;
  activeCompany: Company | null;
  companies: Company[];
  isLoading: boolean;
  setActiveCompany: (companyId: string) => Promise<void>;
  clearActiveCompany: () => Promise<void>;
  isViewingOtherCompany: boolean;
  ownCompanyId: string | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompanyContext = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const roleQuery = useCurrentUserRole();
  const isSuperAdmin = roleQuery.data?.isSuperAdmin ?? false;
  const roleLoading = roleQuery.isLoading;
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null);
  const [activeCompanyData, setActiveCompanyData] = useState<Company | null>(null);
  const [ownCompanyId, setOwnCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all companies (for super_admin) and user's own company
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user's own company
        const { data: profile } = await supabase
          .from('profiles')
          .select('root_company_id')
          .eq('id', user.id)
          .single();

        if (profile?.root_company_id) {
          setOwnCompanyId(profile.root_company_id);
        }

        // Check if super_admin has an active company override
        if (isSuperAdmin) {
          const { data: override } = await supabase
            .from('super_admin_active_company')
            .select('active_company_id')
            .eq('user_id', user.id)
            .single();

          if (override?.active_company_id) {
            setActiveCompanyIdState(override.active_company_id);
          } else {
            setActiveCompanyIdState(profile?.root_company_id || null);
          }

          // Fetch all companies for super_admin
          const { data: allCompanies } = await supabase
            .from('organizational_structure')
            .select(`
              id,
              name,
              fantasy_name,
              logo_url,
              subscription_status,
              subscription_plan_id,
              subscription_plans:subscription_plan_id (name)
            `)
            .eq('type', 'company')
            .order('name');

          if (allCompanies) {
            // Get employee counts for each company
            const companiesWithCounts = await Promise.all(
              allCompanies.map(async (company) => {
                const { count } = await supabase
                  .from('profiles')
                  .select('id', { count: 'exact', head: true })
                  .eq('root_company_id', company.id);

                return {
                  id: company.id,
                  name: company.name,
                  fantasy_name: company.fantasy_name,
                  logo_url: company.logo_url,
                  subscription_status: company.subscription_status,
                  subscription_plan_id: company.subscription_plan_id,
                  planName: (company.subscription_plans as any)?.name || 'Sem plano',
                  employeeCount: count || 0,
                };
              })
            );
            setCompanies(companiesWithCounts);
          }
        } else {
          setActiveCompanyIdState(profile?.root_company_id || null);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!roleLoading) {
      fetchCompanies();
    }
  }, [isSuperAdmin, roleLoading]);

  // Update active company details when activeCompanyId changes
  useEffect(() => {
    if (activeCompanyId && companies.length > 0) {
      const company = companies.find(c => c.id === activeCompanyId);
      setActiveCompanyData(company || null);
    } else if (activeCompanyId && !isSuperAdmin) {
      // For non-super_admin, fetch their own company details
      const fetchOwnCompany = async () => {
        const { data } = await supabase
          .from('organizational_structure')
          .select('id, name, fantasy_name, logo_url, subscription_status, subscription_plan_id')
          .eq('id', activeCompanyId)
          .single();

        if (data) {
          setActiveCompanyData({
            id: data.id,
            name: data.name,
            fantasy_name: data.fantasy_name,
            logo_url: data.logo_url,
            subscription_status: data.subscription_status,
            subscription_plan_id: data.subscription_plan_id,
          });
        }
      };
      fetchOwnCompany();
    }
  }, [activeCompanyId, companies, isSuperAdmin]);

  const handleSetActiveCompany = useCallback(async (companyId: string) => {
    if (!isSuperAdmin) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upsert the active company override
      const { error } = await supabase
        .from('super_admin_active_company')
        .upsert({
          user_id: user.id,
          active_company_id: companyId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setActiveCompanyIdState(companyId);
    } catch (error) {
      console.error('Error setting active company:', error);
    }
  }, [isSuperAdmin]);

  const clearActiveCompany = useCallback(async () => {
    if (!isSuperAdmin || !ownCompanyId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete the override to return to own company
      await supabase
        .from('super_admin_active_company')
        .delete()
        .eq('user_id', user.id);

      setActiveCompanyIdState(ownCompanyId);
    } catch (error) {
      console.error('Error clearing active company:', error);
    }
  }, [isSuperAdmin, ownCompanyId]);

  const isViewingOtherCompany = isSuperAdmin && ownCompanyId !== null && activeCompanyId !== ownCompanyId;

  return (
    <CompanyContext.Provider
      value={{
        activeCompanyId,
        activeCompany: activeCompanyData,
        companies,
        isLoading: isLoading || roleLoading,
        setActiveCompany: handleSetActiveCompany,
        clearActiveCompany,
        isViewingOtherCompany,
        ownCompanyId,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
