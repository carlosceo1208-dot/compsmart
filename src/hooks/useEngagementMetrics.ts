import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

export interface EngagementMetrics {
  enps: number | null;
  enpsBreakdown: {
    promoters: number;
    neutrals: number;
    detractors: number;
    total: number;
  };
  adherenceRate: number;
  feedbackIndex: number;
  pdiVelocity: number;
  totalEvaluations: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  activeGoals: number;
  achievedGoals: number;
  activePdis: number;
  completedPdis: number;
  kudosThisMonth: number;
  oneOnOnesThisMonth: number;
}

export const useEngagementMetrics = () => {
  const { activeCompanyId } = useCompanyContext();

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['engagement-metrics', activeCompanyId],
    queryFn: async (): Promise<EngagementMetrics> => {
      if (!activeCompanyId) {
        return getDefaultMetrics();
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      // Fetch evaluations for eNPS and adherence
      const { data: evaluations } = await supabase
        .from('performance_evaluations')
        .select('id, status, final_score, potential_score')
        .eq('root_company_id', activeCompanyId);

      // Fetch goals
      const { data: goals } = await supabase
        .from('performance_goals')
        .select('id, status')
        .eq('root_company_id', activeCompanyId);

      // Fetch PDIs
      const { data: pdis } = await supabase
        .from('performance_pdi')
        .select('id, status')
        .eq('root_company_id', activeCompanyId);

      // Fetch Kudos this month
      const { data: kudos } = await supabase
        .from('performance_kudos')
        .select('id')
        .eq('root_company_id', activeCompanyId)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      // Fetch 1:1s this month
      const { data: oneOnOnes } = await supabase
        .from('performance_one_on_ones')
        .select('id')
        .eq('root_company_id', activeCompanyId)
        .gte('meeting_date', startOfMonth)
        .lte('meeting_date', endOfMonth);

      // Calculate eNPS based on final_score
      // Promoters: score >= 4.0, Neutrals: 3.0-3.9, Detractors: < 3.0
      const completedEvals = evaluations?.filter(e => e.status === 'approved') || [];
      const promoters = completedEvals.filter(e => (e.final_score || 0) >= 4.0).length;
      const neutrals = completedEvals.filter(e => (e.final_score || 0) >= 3.0 && (e.final_score || 0) < 4.0).length;
      const detractors = completedEvals.filter(e => (e.final_score || 0) < 3.0).length;
      const totalEvaluated = promoters + neutrals + detractors;
      
      const enps = totalEvaluated > 0 
        ? Math.round(((promoters - detractors) / totalEvaluated) * 100)
        : null;

      // Calculate adherence rate
      const totalEvaluations = evaluations?.length || 0;
      const completedEvaluations = evaluations?.filter(e => e.status === 'approved').length || 0;
      const adherenceRate = totalEvaluations > 0 
        ? Math.round((completedEvaluations / totalEvaluations) * 100)
        : 0;

      // Calculate feedback index (kudos + 1:1s per employee)
      const feedbackActivities = (kudos?.length || 0) + (oneOnOnes?.length || 0);
      const feedbackIndex = Math.min(100, feedbackActivities * 10); // Simplified metric

      // Calculate PDI velocity
      const activePdis = pdis?.filter(p => p.status === 'in_progress').length || 0;
      const completedPdis = pdis?.filter(p => p.status === 'completed').length || 0;
      const totalPdis = activePdis + completedPdis;
      const pdiVelocity = totalPdis > 0 
        ? Math.round((completedPdis / totalPdis) * 100)
        : 0;

      // Goals metrics
      const activeGoals = goals?.filter(g => g.status === 'in_progress').length || 0;
      const achievedGoals = goals?.filter(g => g.status === 'achieved').length || 0;

      return {
        enps,
        enpsBreakdown: {
          promoters,
          neutrals,
          detractors,
          total: totalEvaluated,
        },
        adherenceRate,
        feedbackIndex,
        pdiVelocity,
        totalEvaluations,
        completedEvaluations,
        pendingEvaluations: evaluations?.filter(e => e.status === 'pending_review').length || 0,
        activeGoals,
        achievedGoals,
        activePdis,
        completedPdis,
        kudosThisMonth: kudos?.length || 0,
        oneOnOnesThisMonth: oneOnOnes?.length || 0,
      };
    },
    enabled: !!activeCompanyId,
  });

  return {
    metrics: metrics || getDefaultMetrics(),
    isLoading,
    error,
  };
};

function getDefaultMetrics(): EngagementMetrics {
  return {
    enps: null,
    enpsBreakdown: { promoters: 0, neutrals: 0, detractors: 0, total: 0 },
    adherenceRate: 0,
    feedbackIndex: 0,
    pdiVelocity: 0,
    totalEvaluations: 0,
    completedEvaluations: 0,
    pendingEvaluations: 0,
    activeGoals: 0,
    achievedGoals: 0,
    activePdis: 0,
    completedPdis: 0,
    kudosThisMonth: 0,
    oneOnOnesThisMonth: 0,
  };
}
