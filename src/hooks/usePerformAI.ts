import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EmployeeContext {
  id: string;
  full_name: string;
  job_title?: string | null;
  grade?: string | null;
}

const quickActions = [
  { id: '1', questionText: 'Como criar um ciclo de avaliação?', priority: 1 },
  { id: '2', questionText: 'O que é a Matriz 9Box?', priority: 2 },
  { id: '3', questionText: 'Como cascatear metas?', priority: 3 },
  { id: '4', questionText: 'Para que serve o PDI?', priority: 4 },
  { id: '5', questionText: 'Como enviar Kudos?', priority: 5 },
  { id: '6', questionText: 'Qual a diferença entre avaliação e feedback?', priority: 6 },
];

const intelligentActions = [
  { id: 'analyze', label: 'Analisar Colaborador', icon: 'user-search', prompt: 'Faça uma análise completa do colaborador selecionado, incluindo histórico de avaliações, pontos fortes, áreas de melhoria e recomendações.' },
  { id: 'feedback', label: 'Gerar Devolutiva', icon: 'file-text', prompt: 'Gere um texto de devolutiva personalizado para o colaborador selecionado, considerando os scores das avaliações e competências.' },
  { id: 'pdi', label: 'Sugerir PDI', icon: 'target', prompt: 'Sugira um Plano de Desenvolvimento Individual (PDI) com 3-5 ações específicas baseadas nos gaps identificados nas avaliações.' },
  { id: '9box', label: 'Explicar 9Box', icon: 'grid', prompt: 'Explique detalhadamente a posição do colaborador na Matriz 9Box e o que isso significa para seu desenvolvimento.' },
  { id: 'compare', label: 'Comparar Ciclos', icon: 'trending-up', prompt: 'Compare o desempenho do colaborador entre os últimos ciclos de avaliação, identificando evolução ou regressão.' },
];

export const usePerformAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeContext | null>(null);
  const location = useLocation();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build context with employee info if selected
      let enrichedQuestion = content.trim();
      if (selectedEmployee) {
        enrichedQuestion = `[Contexto: Colaborador selecionado - ${selectedEmployee.full_name}, Cargo: ${selectedEmployee.job_title || 'N/A'}, Grade: ${selectedEmployee.grade || 'N/A'}]\n\n${content.trim()}`;
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/performance-assistant`;
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          question: enrichedQuestion,
          pageContext: location.pathname,
          employeeId: selectedEmployee?.id,
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Muitas requisições. Aguarde alguns segundos e tente novamente.');
          setMessages(prev => prev.filter(m => m.timestamp !== userMessage.timestamp));
          return;
        }
        if (response.status === 402) {
          toast.error('Créditos de IA insuficientes.');
          setMessages(prev => prev.filter(m => m.timestamp !== userMessage.timestamp));
          return;
        }
        throw new Error('Failed to get response');
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream') && response.body) {
        // Streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let textBuffer = '';

        // Add empty assistant message
        const assistantMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                assistantContent += deltaContent;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              // Incomplete JSON, put back in buffer
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      } else {
        // Non-streaming response
        const data = await response.json();
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.answer || 'Desculpe, não consegui processar sua pergunta.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem. Verifique sua conexão.');
      setMessages(prev => prev.filter(m => m.timestamp !== userMessage.timestamp));
    } finally {
      setIsLoading(false);
    }
  }, [location.pathname, selectedEmployee]);

  const executeIntelligentAction = useCallback((actionId: string) => {
    const action = intelligentActions.find(a => a.id === actionId);
    if (action) {
      sendMessage(action.prompt);
    }
  }, [sendMessage]);

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    isLoading,
    quickActions,
    intelligentActions,
    selectedEmployee,
    setSelectedEmployee,
    sendMessage,
    executeIntelligentAction,
    clearMessages,
  };
};
