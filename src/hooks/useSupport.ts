import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  questionText: string;
  priority: number;
}

export const useSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const location = useLocation();

  // Carregar quick actions contextuais
  useEffect(() => {
    loadQuickActions();
  }, [location.pathname]);

  const loadQuickActions = async () => {
    try {
      const { data, error } = await supabase
        .from('support_quick_actions')
        .select('id, question_text, priority')
        .or(`page_path.eq.*,page_path.eq.${location.pathname}`)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(6);

      if (error) throw error;

      setQuickActions(data.map(item => ({
        id: item.id,
        questionText: item.question_text,
        priority: item.priority,
      })));
    } catch (error) {
      console.error('Error loading quick actions:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('support-assistant', {
        body: {
          question: content.trim(),
          pageContext: location.pathname,
        },
      });

      if (error) {
        console.error('Support assistant error:', error);
        
        if (error.message?.includes('429')) {
          toast.error('Muitas requisições. Aguarde alguns segundos e tente novamente.');
        } else if (error.message?.includes('402')) {
          toast.error('Créditos de IA insuficientes. Entre em contato com o administrador.');
        } else {
          toast.error('Erro ao processar sua pergunta. Tente novamente.');
        }
        
        // Remover mensagem do usuário em caso de erro
        setMessages(prev => prev.filter(m => m.timestamp !== userMessage.timestamp));
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem. Verifique sua conexão.');
      setMessages(prev => prev.filter(m => m.timestamp !== userMessage.timestamp));
    } finally {
      setIsLoading(false);
    }
  };

  const sendFeedback = async (conversationId: string, helpful: boolean, comment?: string) => {
    try {
      const { error } = await supabase
        .from('support_conversations')
        .update({
          helpful,
          feedback_comment: comment || null,
        })
        .eq('id', conversationId);

      if (error) throw error;

      toast.success('Obrigado pelo feedback!');
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    isLoading,
    quickActions,
    sendMessage,
    sendFeedback,
    clearMessages,
  };
};