import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  user_id: string;
  agent_type: string;
  title: string | null;
  message_count: number;
  last_message_at: string;
  is_archived: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  question: string;
  answer: string;
  operation_mode?: string;
  document_name?: string;
  created_at: string;
}

export const useIncentiveAssistantSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSessions = async (includeArchived: boolean = false) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_type', 'incentive')
        .order('last_message_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      } else {
        query = query.eq('is_archived', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar sessões',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          agent_type: 'incentive',
          title: `Incentivos R&B - ${new Date().toLocaleDateString('pt-BR')}`,
          message_count: 0,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(data.id);
      await fetchSessions(showArchived);
      
      toast({
        title: 'Nova sessão criada',
        description: 'Comece sua consultoria de incentivos',
      });

      return data.id;
    } catch (error: any) {
      toast({
        title: 'Erro ao criar sessão',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const archiveSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_sessions')
        .update({ is_archived: !showArchived })
        .eq('id', sessionId);

      if (error) throw error;

      await fetchSessions(showArchived);

      toast({
        title: showArchived ? 'Sessão desarquivada' : 'Sessão arquivada',
        description: showArchived ? 'Sessão restaurada' : 'Sessão movida para arquivo',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao arquivar sessão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const unarchiveSession = async (sessionId: string) => {
    await archiveSession(sessionId);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }

      await fetchSessions(showArchived);

      toast({
        title: 'Sessão excluída',
        description: 'Sessão removida permanentemente',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir sessão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchSessionConversations = async (sessionId: string): Promise<Conversation[]> => {
    try {
      const { data, error } = await supabase
        .from('incentive_assistant_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar conversas',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
  };

  const refreshSessions = () => {
    fetchSessions(showArchived);
  };

  useEffect(() => {
    fetchSessions(showArchived);
  }, [showArchived]);

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    showArchived,
    setShowArchived,
    loading,
    createNewSession,
    archiveSession,
    unarchiveSession,
    deleteSession,
    fetchSessionConversations,
    refreshSessions,
  };
};
