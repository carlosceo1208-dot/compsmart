import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickActions = [
  { id: '1', questionText: 'Como criar um ciclo de avaliação?', priority: 1 },
  { id: '2', questionText: 'O que é a Matriz 9Box?', priority: 2 },
  { id: '3', questionText: 'Como cascatear metas?', priority: 3 },
  { id: '4', questionText: 'Para que serve o PDI?', priority: 4 },
  { id: '5', questionText: 'Como enviar Kudos?', priority: 5 },
  { id: '6', questionText: 'Qual a diferença entre avaliação e feedback?', priority: 6 },
];

export const usePerformAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

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
      const { data, error } = await supabase.functions.invoke('performance-assistant', {
        body: {
          question: content.trim(),
          pageContext: location.pathname,
        },
      });

      if (error) {
        console.error('PerformAI error:', error);
        
        if (error.message?.includes('429')) {
          toast.error('Muitas requisições. Aguarde alguns segundos e tente novamente.');
        } else if (error.message?.includes('402')) {
          toast.error('Créditos de IA insuficientes.');
        } else {
          toast.error('Erro ao processar sua pergunta. Tente novamente.');
        }
        
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
    clearMessages,
  };
};
