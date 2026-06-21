import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'starter' | 'medium' | 'pro' | 'enterprise' | 'nr1_essencial';

export type SubscriptionStatus = 'active' | 'trial' | 'canceled' | 'expired' | 'past_due' | 'deleted';

interface FeatureAccessResult {
  plan: PlanType;
  status: SubscriptionStatus;
  loading: boolean;
  maxEmployees: number | null;
  maxUsers: number | null;
  hasAccess: (feature: string) => boolean;
  canAddEmployees: (currentCount: number) => boolean;
  canAddUsers: (currentCount: number) => boolean;
  trialEndsAt: string | null;
  daysLeftInTrial: number | null;
  // New fields for blocking system
  isBlocked: boolean;
  daysUntilDeletion: number | null;
  dataDeletionScheduledAt: string | null;
  // Admin override
  isAdminOrSuperAdmin: boolean;
}

// Feature map: which plans have access to each feature
const featureMap: Record<string, PlanType[]> = {
  // === TODOS OS PLANOS (Starter+) ===
  employees: ['starter', 'medium', 'pro', 'enterprise'],
  job_titles: ['starter', 'medium', 'pro', 'enterprise'],
  salary_ranges: ['starter', 'medium', 'pro', 'enterprise'],
  organization: ['starter', 'medium', 'pro', 'enterprise'],
  people_analytics: ['starter', 'medium', 'pro', 'enterprise'],
  survey_data: ['starter', 'medium', 'pro', 'enterprise'],
  my_profile: ['starter', 'medium', 'pro', 'enterprise'],
  roles: ['starter', 'medium', 'pro', 'enterprise'],
  access_control: ['starter', 'medium', 'pro', 'enterprise'],
  settings: ['starter', 'medium', 'pro', 'enterprise'],
  benefits_basic: ['starter', 'medium', 'pro', 'enterprise'],
  
  // NOVOS para Starter (agora disponíveis para todos)
  legal_assistant: ['starter', 'medium', 'pro', 'enterprise'], // IA Jurídico para TODOS
  salary_comparison: ['starter', 'medium', 'pro', 'enterprise'], // Comparação Salarial Avançada
  points_evaluation: ['starter', 'medium', 'pro', 'enterprise'], // Avaliação de Cargos por Pontos
  currency_converter: ['starter', 'medium', 'pro', 'enterprise'], // Conversão de Moeda
  charges_calculator: ['starter', 'medium', 'pro', 'enterprise'], // Calculadora de Encargos
  salary_tables: ['starter', 'medium', 'pro', 'enterprise'], // Tabela Salarial
  
  // === MEDIUM+ ===
  salary_assistant: ['medium', 'pro', 'enterprise'], // IA Salary Smart
  organogram: ['medium', 'pro', 'enterprise'], // Organograma Interativo
  budget_planning: ['medium', 'pro', 'enterprise'], // Planejamento Orçamentário
  budget_approvals: ['medium', 'pro', 'enterprise'],
  manager_access: ['medium', 'pro', 'enterprise'], // Acesso do Gestor à própria área
  salary_simulation: ['medium', 'pro', 'enterprise'], // Simulação de Políticas Salariais
  advanced_analytics: ['medium', 'pro', 'enterprise'],
  alerts: ['medium', 'pro', 'enterprise'],
  audit_logs: ['medium', 'pro', 'enterprise'],
  knowledge_base: ['medium', 'pro', 'enterprise'],
  
  // === PRO+ ===
  incentive_assistant: ['pro', 'enterprise'], // IA Rem.&Benef Smart
  incentive_programs: ['pro', 'enterprise'],
  benefits_advanced: ['pro', 'enterprise'],
  salary_analysis_report: ['pro', 'enterprise'],
  employee_portal: ['pro', 'enterprise'], // Portal do Funcionário (opcional)
  employee_self_edit: ['pro', 'enterprise'], // Edição pelo funcionário (telefone, email, endereço)
  salary_modality_advanced: ['pro', 'enterprise'], // Total Cash e Total Compensation
  merit_governance: ['pro', 'enterprise'], // Budget Burn-Down, Approval Inbox, Decision Scenarios
  
  // === ENTERPRISE ONLY ===
  api_access: ['enterprise'],
  white_label: ['enterprise'],
  sso: ['enterprise'],
  custom_integrations: ['enterprise'],

  // === NR-1 (módulo híbrido: standalone "Essencial" + incluído em Pro/Enterprise) ===
  nr1_essencial: ['nr1_essencial', 'pro', 'enterprise'],
  nr1_clima: ['nr1_essencial', 'pro', 'enterprise'],
  nr1_planos_acao: ['nr1_essencial', 'pro', 'enterprise'],
  nr1_diagnosticos: ['nr1_essencial', 'pro', 'enterprise'],
  nr1_biblioteca: ['nr1_essencial', 'pro', 'enterprise'],
  // NR-1 Pro: recursos avançados, somente Pro/Enterprise
  nr1_pro: ['pro', 'enterprise'],
  nr1_inteligencia: ['pro', 'enterprise'],
  nr1_bem_estar_agent: ['pro', 'enterprise'],
  nr1_jornada_agent: ['pro', 'enterprise'],
  nr1_terceiros: ['pro', 'enterprise'],
  nr1_clima_correlacao: ['pro', 'enterprise'],

  // === Add-ons opcionais (independentes do plano) ===
  // Liberados pelos respectivos flags em organizational_structure OU como parte do NR-1 / Pro / Enterprise
  clima_organizacional: ['nr1_essencial', 'pro', 'enterprise'],
  nr1_fib: ['nr1_essencial', 'pro', 'enterprise'],
  nr1_acompanhamento: ['nr1_essencial', 'pro', 'enterprise'],
};

// Map route paths to feature keys
const pathToFeatureMap: Record<string, string> = {
  '/employees': 'employees',
  '/job-titles': 'job_titles',
  '/salary-ranges': 'salary_ranges',
  '/organization': 'organization',
  '/people-analytics': 'people_analytics',
  '/survey-data': 'survey_data',
  '/my-profile': 'my_profile',
  '/roles': 'roles',
  '/access-control': 'access_control',
  '/settings': 'settings',
  '/benefits': 'benefits_basic',
  '/salary-comparison': 'salary_comparison',
  '/alert-settings': 'alerts',
  '/audit-logs': 'audit_logs',
  '/knowledge-base': 'knowledge_base',
  '/budget-planning': 'budget_planning',
  '/budget-approvals': 'budget_approvals',
  '/legal-assistant': 'legal_assistant',
  '/salary-assistant': 'salary_assistant',
  '/incentive-assistant': 'incentive_assistant',
  '/incentive-programs': 'incentive_programs',
  '/salary-analysis-report': 'salary_analysis_report',
  '/organogram': 'organogram',
  '/budget-burndown': 'merit_governance',
  '/approval-inbox': 'merit_governance',
  '/decision-scenarios': 'merit_governance',
};

// Get required plan for a feature
export const getRequiredPlanForFeature = (feature: string): PlanType | undefined => {
  const allowedPlans = featureMap[feature];
  if (!allowedPlans || allowedPlans.length === 0) return undefined;
  
  // Return the minimum required plan (first in the hierarchy)
  const planHierarchy: PlanType[] = ['starter', 'medium', 'pro', 'enterprise'];
  for (const plan of planHierarchy) {
    if (allowedPlans.includes(plan)) {
      return plan === 'starter' ? undefined : plan; // Don't show lock for starter features
    }
  }
  return undefined;
};

// Get required plan for a path
export const getRequiredPlanForPath = (path: string): PlanType | undefined => {
  const feature = pathToFeatureMap[path];
  if (!feature) return undefined;
  return getRequiredPlanForFeature(feature);
};

export const useFeatureAccess = (): FeatureAccessResult => {
  const [plan, setPlan] = useState<PlanType>('starter');
  const [status, setStatus] = useState<SubscriptionStatus>('trial');
  const [loading, setLoading] = useState(true);
  const [maxEmployees, setMaxEmployees] = useState<number | null>(null);
  const [maxUsers, setMaxUsers] = useState<number | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [daysLeftInTrial, setDaysLeftInTrial] = useState<number | null>(null);
  // New state for blocking system
  const [isBlocked, setIsBlocked] = useState(false);
  const [daysUntilDeletion, setDaysUntilDeletion] = useState<number | null>(null);
  const [dataDeletionScheduledAt, setDataDeletionScheduledAt] = useState<string | null>(null);
  // Admin override - admins/super_admins bypass plan restrictions
  const [isAdminOrSuperAdmin, setIsAdminOrSuperAdmin] = useState(false);
  // Add-ons opcionais independentes do plano
  const [nr1AddonEnabled, setNr1AddonEnabled] = useState(false);
  const [climaAddonEnabled, setClimaAddonEnabled] = useState(false);

  useEffect(() => {
    const fetchCompanySubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Check if user is admin or super_admin - they bypass all plan restrictions
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const roles = userRoles?.map(r => r.role) || [];
        const hasAdminRole = roles.includes('admin') || roles.includes('super_admin');
        setIsAdminOrSuperAdmin(hasAdminRole);

        // Get user's profile to find their company
        const { data: profile } = await supabase
          .from('profiles')
          .select('root_company_id')
          .eq('id', user.id)
          .single();

        if (!profile?.root_company_id) {
          setLoading(false);
          return;
        }

        // Fetch add-ons opcionais (independentes do plano)
        const { data: companyAddon } = await supabase
          .from('organizational_structure')
          .select('nr1_addon_enabled, clima_addon_enabled')
          .eq('id', profile.root_company_id)
          .maybeSingle();
        setNr1AddonEnabled(!!(companyAddon as any)?.nr1_addon_enabled);
        setClimaAddonEnabled(!!(companyAddon as any)?.clima_addon_enabled);

        // Get company subscription with plan details
        const { data: subscription } = await supabase
          .from('company_subscriptions')
          .select(`
            *,
            subscription_plans (
              id,
              name,
              plan_type,
              max_employees,
              max_users,
              features
            )
          `)
          .eq('company_id', profile.root_company_id)
          .eq('status', 'active')
          .maybeSingle();

        if (subscription?.subscription_plans) {
          const planData = subscription.subscription_plans;
          setPlan(planData.plan_type as PlanType);
          setStatus(subscription.status as SubscriptionStatus);
          setMaxEmployees(planData.max_employees);
          setMaxUsers(planData.max_users);
          setIsBlocked(false);
        } else {
          // Check for trial/expired status in organizational_structure
          const { data: company } = await supabase
            .from('organizational_structure')
            .select('subscription_status, trial_ends_at, subscription_plan_id, data_deletion_scheduled_at')
            .eq('id', profile.root_company_id)
            .single();

          if (company) {
            if (company.subscription_status === 'trial' && company.trial_ends_at) {
              setStatus('trial');
              setTrialEndsAt(company.trial_ends_at);
              setIsBlocked(false);
              
              // Calculate days left in trial
              const trialEnd = new Date(company.trial_ends_at);
              const now = new Date();
              const diffTime = trialEnd.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setDaysLeftInTrial(diffDays > 0 ? diffDays : 0);
              
              // Trial users get Pro features
              setPlan('pro');
            } else if (company.subscription_status === 'expired') {
              setStatus('expired');
              setPlan('starter');
              setIsBlocked(true); // BLOCKED!
              
              // Calculate days until deletion
              if (company.data_deletion_scheduled_at) {
                setDataDeletionScheduledAt(company.data_deletion_scheduled_at);
                const deletionDate = new Date(company.data_deletion_scheduled_at);
                const now = new Date();
                const diffTime = deletionDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setDaysUntilDeletion(diffDays > 0 ? diffDays : 0);
              }
            } else if (company.subscription_status === 'deleted') {
              setStatus('deleted' as SubscriptionStatus);
              setIsBlocked(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanySubscription();
  }, []);

  const hasAccess = (feature: string): boolean => {
    // ADMIN OVERRIDE: Admins and Super Admins always have access to all features
    if (isAdminOrSuperAdmin) {
      return true;
    }

    // NR-1 add-on: libera os recursos do NR-1 Essencial em qualquer plano contratado
    if (nr1AddonEnabled && (
      feature === 'nr1_essencial' ||
      feature === 'nr1_clima' ||
      feature === 'nr1_planos_acao' ||
      feature === 'nr1_diagnosticos' ||
      feature === 'nr1_biblioteca' ||
      feature === 'clima_organizacional'
    )) {
      return true;
    }

    // Clima Organizacional add-on: libera o módulo de clima em qualquer plano
    if (climaAddonEnabled && feature === 'clima_organizacional') {
      return true;
    }

    // During trial, grant Pro-level access
    if (status === 'trial' && daysLeftInTrial && daysLeftInTrial > 0) {
      const trialPlan: PlanType = 'pro';
      return featureMap[feature]?.includes(trialPlan) ?? true;
    }

    // Expired/canceled = starter only
    if (status === 'expired' || status === 'canceled') {
      return featureMap[feature]?.includes('starter') ?? true;
    }

    return featureMap[feature]?.includes(plan) ?? true;
  };

  const canAddEmployees = (currentCount: number): boolean => {
    if (maxEmployees === null || maxEmployees === -1) return true; // -1 = unlimited
    return currentCount < maxEmployees;
  };

  const canAddUsers = (currentCount: number): boolean => {
    if (maxUsers === null || maxUsers === -1) return true; // -1 = unlimited
    return currentCount < maxUsers;
  };

  return {
    plan,
    status,
    loading,
    maxEmployees,
    maxUsers,
    hasAccess,
    canAddEmployees,
    canAddUsers,
    trialEndsAt,
    daysLeftInTrial,
    isBlocked,
    daysUntilDeletion,
    dataDeletionScheduledAt,
    isAdminOrSuperAdmin,
  };
};
