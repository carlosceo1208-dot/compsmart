import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'starter' | 'medium' | 'pro';

export const useFeatureAccess = () => {
  const [plan, setPlan] = useState<PlanType>('starter');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('plan_type')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setPlan(data.plan_type as PlanType);
        }
      }
      setLoading(false);
    };

    fetchUserPlan();
  }, []);

  const hasAccess = (feature: string): boolean => {
    const featureMap: Record<string, PlanType[]> = {
      legal_assistant: ['pro'],
      advanced_analytics: ['medium', 'pro'],
      unlimited_employees: ['pro'],
      survey_data: ['medium', 'pro'],
    };

    return featureMap[feature]?.includes(plan) ?? true;
  };

  return { plan, hasAccess, loading };
};
