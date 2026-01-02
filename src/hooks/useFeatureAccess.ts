import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'starter' | 'medium' | 'pro' | 'enterprise';

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
}

// Feature map: which plans have access to each feature
const featureMap: Record<string, PlanType[]> = {
  // All plans (Starter+)
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
  
  // Medium+ plans
  salary_comparison: ['medium', 'pro', 'enterprise'],
  advanced_analytics: ['medium', 'pro', 'enterprise'],
  alerts: ['medium', 'pro', 'enterprise'],
  audit_logs: ['medium', 'pro', 'enterprise'],
  knowledge_base: ['medium', 'pro', 'enterprise'],
  budget_planning: ['medium', 'pro', 'enterprise'],
  budget_approvals: ['medium', 'pro', 'enterprise'],
  
  // Pro+ plans
  legal_assistant: ['pro', 'enterprise'],
  salary_assistant: ['pro', 'enterprise'],
  incentive_assistant: ['pro', 'enterprise'],
  incentive_programs: ['pro', 'enterprise'],
  benefits_advanced: ['pro', 'enterprise'],
  salary_analysis_report: ['pro', 'enterprise'],
  
  // Enterprise only
  api_access: ['enterprise'],
  white_label: ['enterprise'],
  sso: ['enterprise'],
  custom_integrations: ['enterprise'],
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

  useEffect(() => {
    const fetchCompanySubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

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
  };
};
