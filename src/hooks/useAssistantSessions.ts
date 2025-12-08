import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AgentType = 'legal' | 'salary' | 'incentive';

interface Session {
  id: string;
  title: string | null;
  created_at: string;
  last_message_at: string;
  message_count: number;
  is_archived: boolean;
}

interface Conversation {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  document_name?: string;
  operation_mode?: string;
  legal_references?: any;
}

const CONVERSATION_TABLES = {
  legal: 'legal_assistant_conversations',
  salary: 'salary_assistant_conversations',
  incentive: 'incentive_assistant_conversations',
} as const;

const SESSION_TITLES = {
  legal: 'Nova Consulta Jurídica',
  salary: 'Nova Análise Salarial',
  incentive: 'Nova Consulta R&B',
} as const;

export const useAssistantSessions = (agentType: AgentType) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async (includeArchived = false) => {
    setLoading(true);
    try {
      const query = supabase
        .from('conversation_sessions')
        .select('*')
        .eq('agent_type', agentType)
        .order('last_message_at', { ascending: false });

      if (!includeArchived) {
        query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          agent_type: agentType,
          title: `${SESSION_TITLES[agentType]} - ${new Date().toLocaleDateString('pt-BR')}`,
          root_company_id: profile?.root_company_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(data.id);
      await fetchSessions(showArchived);
      toast.success('Nova sessão criada');
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Erro ao criar nova sessão');
      return null;
    }
  };

  const archiveSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_sessions')
        .update({ is_archived: true })
        .eq('id', sessionId);

      if (error) throw error;

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }

      await fetchSessions(showArchived);
      toast.success('Sessão arquivada');
    } catch (error) {
      console.error('Error archiving session:', error);
      toast.error('Erro ao arquivar sessão');
    }
  };

  const unarchiveSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_sessions')
        .update({ is_archived: false })
        .eq('id', sessionId);

      if (error) throw error;

      await fetchSessions(showArchived);
      toast.success('Sessão restaurada');
    } catch (error) {
      console.error('Error unarchiving session:', error);
      toast.error('Erro ao restaurar sessão');
    }
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
      toast.success('Sessão deletada');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Erro ao deletar sessão');
    }
  };

  const fetchSessionConversations = async (sessionId: string): Promise<Conversation[]> => {
    try {
      const tableName = CONVERSATION_TABLES[agentType];
      const { data, error } = await supabase
        .from(tableName)
        .select('id, question, answer, created_at, document_name, operation_mode')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchSessions(showArchived);
  }, [showArchived, agentType]);

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
    refreshSessions: () => fetchSessions(showArchived),
  };
};
