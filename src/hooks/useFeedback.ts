import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type FeedbackType = 'suggestion' | 'bug' | 'praise' | 'question';
export type FeedbackStatus = 'new' | 'reviewing' | 'planned' | 'implemented' | 'declined';

export interface Feedback {
  id: string;
  user_id: string | null;
  root_company_id: string | null;
  type: FeedbackType;
  title: string;
  description: string;
  page_url: string | null;
  user_agent: string | null;
  nps_score: number | null;
  status: FeedbackStatus;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateFeedbackInput {
  type: FeedbackType;
  title: string;
  description: string;
  page_url?: string;
  user_agent?: string;
  nps_score?: number | null;
}

export function useFeedback() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's own feedbacks
  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['user-feedbacks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Feedback[];
    },
  });

  // Create feedback mutation
  const createFeedback = useMutation({
    mutationFn: async (input: CreateFeedbackInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get user's root_company_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          root_company_id: profile?.root_company_id,
          type: input.type,
          title: input.title,
          description: input.description,
          page_url: input.page_url,
          user_agent: input.user_agent,
          nps_score: input.nps_score,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-feedbacks'] });
      toast({
        title: 'Obrigado pelo feedback!',
        description: 'Sua contribuição é muito importante para nós.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar feedback',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    feedbacks,
    isLoading,
    createFeedback,
  };
}

// Hook for super admin to view all feedbacks
export function useAllFeedbacks(filters?: {
  type?: FeedbackType;
  status?: FeedbackStatus;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['all-feedbacks', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_feedback')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          ),
          company:root_company_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Hook for feedback KPIs
export function useFeedbackKPIs() {
  return useQuery({
    queryKey: ['feedback-kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('type, status, nps_score');

      if (error) throw error;

      const total = data.length;
      const byType = {
        suggestion: data.filter(f => f.type === 'suggestion').length,
        bug: data.filter(f => f.type === 'bug').length,
        praise: data.filter(f => f.type === 'praise').length,
        question: data.filter(f => f.type === 'question').length,
      };
      const byStatus = {
        new: data.filter(f => f.status === 'new').length,
        reviewing: data.filter(f => f.status === 'reviewing').length,
        planned: data.filter(f => f.status === 'planned').length,
        implemented: data.filter(f => f.status === 'implemented').length,
        declined: data.filter(f => f.status === 'declined').length,
      };
      const npsScores = data.filter(f => f.nps_score !== null).map(f => f.nps_score as number);
      const avgNPS = npsScores.length > 0 
        ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length 
        : null;

      return {
        total,
        byType,
        byStatus,
        avgNPS,
        pending: byStatus.new + byStatus.reviewing,
      };
    },
  });
}

// Hook to update feedback status (super admin)
export function useUpdateFeedbackStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, internal_notes }: { 
      id: string; 
      status: FeedbackStatus; 
      internal_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('user_feedback')
        .update({ status, internal_notes })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-kpis'] });
      toast({
        title: 'Status atualizado',
        description: 'O feedback foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
