import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

export type ModuleSlug =
  | 'core'
  | 'insight'
  | 'match'
  | 'nr1'
  | 'clima'
  | 'talent'
  | 'evolve'
  | 'potencial-sucessao'
  | 'rh-service'
  | (string & {});

const VIEW_AS_CLIENT_KEY = 'viewAsClient';

const fallbackModuleNames: Record<string, string> = {
  core: 'Gestão Estratégica de Remuneração e Desempenho',
  insight: 'Insight de Mercado',
  match: 'Job Match',
  nr1: 'Saúde Mental & Bem-Estar (NR-1)',
  clima: 'Clima Organizacional',
  talent: 'Seleção & Recrutamento',
  evolve: 'Treinamento & PDI',
  'potencial-sucessao': 'Avaliação de Potencial e Sucessão',
  'rh-service': 'RH Service',
};

const getViewAsClient = () =>
  typeof window !== 'undefined' && window.localStorage.getItem(VIEW_AS_CLIENT_KEY) === 'true';

export const useModuleAccess = () => {
  const { activeCompanyId, isLoading: companyLoading } = useCompanyContext();
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();
  const [viewAsClient, setViewAsClient] = useState(getViewAsClient);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === VIEW_AS_CLIENT_KEY) setViewAsClient(event.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const catalogQuery = useQuery({
    queryKey: ['module-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const tenantModulesQuery = useQuery({
    queryKey: ['tenant-modules', activeCompanyId],
    enabled: !!activeCompanyId && !companyLoading,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tenant_modules');
      if (error) throw error;
      return (data ?? []).map((row) => row.slug as ModuleSlug);
    },
    staleTime: 60 * 1000,
  });

  const catalog = catalogQuery.data ?? [];
  const moduleNames = useMemo(() => {
    const names = new Map<string, string>();
    Object.entries(fallbackModuleNames).forEach(([slug, name]) => names.set(slug, name));
    catalog.forEach((module) => names.set(module.slug, module.nome));
    return names;
  }, [catalog]);

  const contractedModules = useMemo(
    () => new Set<ModuleSlug>(tenantModulesQuery.data ?? []),
    [tenantModulesQuery.data],
  );

  const isAdminOrSuperAdmin = !!roleData?.isAdmin || !!roleData?.isSuperAdmin;
  const adminBypass = isAdminOrSuperAdmin && !viewAsClient;

  const hasModule = (slug: ModuleSlug) => {
    if (adminBypass) return true;
    // Consultores CompSmart operam o RH Service para clientes; o acesso aos
    // dados de cada cliente é validado por projeto ativo no backend.
    if (slug === 'rh-service' && (roleData as { isConsultor?: boolean } | undefined)?.isConsultor) return true;
    return contractedModules.has(slug);
  };

  const hasAnyModule = (slugs: ModuleSlug[]) => {
    if (slugs.length === 0) return true;
    return slugs.some((slug) => hasModule(slug));
  };

  const hasAllModules = (slugs: ModuleSlug[]) => {
    if (slugs.length === 0) return true;
    return slugs.every((slug) => hasModule(slug));
  };

  const getModuleName = (slug: ModuleSlug) => moduleNames.get(slug) ?? slug;

  return {
    catalog,
    contractedModules,
    moduleNames,
    loading: companyLoading || roleLoading || catalogQuery.isLoading || tenantModulesQuery.isLoading,
    error: catalogQuery.error ?? tenantModulesQuery.error,
    isAdminOrSuperAdmin,
    viewAsClient,
    hasModule,
    hasAnyModule,
    hasAllModules,
    getModuleName,
  };
};