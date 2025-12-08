import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Send, ShieldCheck, TrendingUp, BarChart3, Target } from 'lucide-react';
import { QuickActions, QuickAction } from '@/components/assistant/QuickActions';
import { DocumentUpload } from '@/components/assistant/DocumentUpload';
import { ContextBadges } from '@/components/assistant/ContextBadges';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AssistantSessionSidebar } from '@/components/assistant/AssistantSessionSidebar';
import { AssistantConversationCard } from '@/components/assistant/AssistantConversationCard';
import { useAssistantSessions } from '@/hooks/useAssistantSessions';

interface Conversation {
  id?: string;
  question: string;
  answer: string;
  document_name?: string;
  operation_mode?: string;
  created_at?: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'Analisar Equidade Interna',
    prompt: '/analise_equidade Identifique funcionários fora da faixa salarial ideal e sugira ajustes',
    icon: BarChart3,
    mode: 'analise_equidade',
  },
  {
    label: 'Comparar com Mercado',
    prompt: '/benchmark_mercado Compare nossa tabela com dados de pesquisas salariais e indique gaps',
    icon: TrendingUp,
    mode: 'benchmark_mercado',
  },
  {
    label: 'Calcular Compa-Ratio',
    prompt: 'Calcule o compa-ratio de todos os funcionários e identifique casos críticos',
    icon: Calculator,
  },
  {
    label: 'Identificar Distorções',
    prompt: '/distorcoes Encontre casos de compressão salarial ou inversões hierárquicas',
    icon: Target,
    mode: 'distorcoes',
  },
];

const SalaryAssistant = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [charCount, setCharCount] = useState(0);
  const { toast } = useToast();

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    showArchived,
    setShowArchived,
    loading: sessionsLoading,
    createNewSession,
    archiveSession,
    unarchiveSession,
    deleteSession,
    fetchSessionConversations,
    refreshSessions,
  } = useAssistantSessions('salary');

  const maxChars = 50000;

  useEffect(() => {
    setCharCount(question.length + documentText.length);
  }, [question, documentText]);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionConversations();
    } else {
      setConversations([]);
    }
  }, [currentSessionId]);

  const loadSessionConversations = async () => {
    if (!currentSessionId) return;
    const data = await fetchSessionConversations(currentSessionId);
    setConversations(data);
  };

  const handleFileSelect = (file: File, text: string) => {
    setUploadedFile(file);
    setDocumentText(text);
    setDocumentName(file.name);
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    setDocumentText('');
    setDocumentName('');
  };

  const handleQuickAction = (prompt: string) => {
    setQuestion(prompt);
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('salary-assistant', {
        body: { 
          question, 
          document_text: documentText || undefined,
          document_name: documentName || undefined,
          session_id: sessionId,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Erro',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      // Atualização otimista - adiciona conversa imediatamente
      const newConversation: Conversation = {
        question,
        answer: data.answer,
        operation_mode: data.operation_mode,
        document_name: documentName || undefined,
        created_at: new Date().toISOString(),
      };
      setConversations(prev => [...prev, newConversation]);

      toast({
        title: 'Análise concluída',
        description: `Consulta processada com sucesso (${data.tokens_used} tokens)`,
      });

      setQuestion('');
      handleFileRemove();
      refreshSessions();
    } catch (error: any) {
      toast({
        title: 'Erro ao processar análise',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const activeMode = question.toLowerCase().startsWith('/') 
    ? question.substring(1).split(' ')[0]
    : undefined;

  return (
    <div className="min-h-[calc(100vh-8rem)] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Agente de Análise Salarial</h1>
              <p className="text-muted-foreground">
                Estruturas, faixas salariais, compa-ratio e benchmarking
              </p>
            </div>
          </div>
          <ContextBadges agent="salary" activeMode={activeMode} />
        </div>

        <Alert className="mb-6 border-green-500/50 bg-green-500/10">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <AlertTitle>Privacidade e Segurança</AlertTitle>
          <AlertDescription>
            Todas as análises são privadas e isoladas. 
            Seus dados salariais nunca são compartilhados com outras empresas.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          <AssistantSessionSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            showArchived={showArchived}
            loading={sessionsLoading}
            onSelectSession={setCurrentSessionId}
            onCreateSession={createNewSession}
            onArchiveSession={archiveSession}
            onUnarchiveSession={unarchiveSession}
            onDeleteSession={deleteSession}
            onToggleArchived={setShowArchived}
          />

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <QuickActions 
                  actions={quickActions} 
                  onActionClick={handleQuickAction}
                  disabled={loading}
                />
              </CardContent>
            </Card>

            {currentSessionId && (
              <AssistantConversationCard
                conversations={conversations}
                loading={loading}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Anexar Documento (Opcional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DocumentUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  uploadedFile={uploadedFile}
                  isProcessing={loading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nova Análise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder={
                      conversations.length === 0 
                        ? "Digite sua dúvida sobre estrutura salarial, compa-ratio ou benchmarking...\n\nExemplos:\n- Calcule o compa-ratio dos funcionários\n- Compare nossa Grade C com o mercado\n- Identifique distorções salariais\n\nModos especiais:\n/analise_equidade - Análise de equidade interna\n/benchmark_mercado - Comparação com mercado\n/recomendacao_ajuste - Sugestões de ajustes"
                        : "Digite sua próxima pergunta sobre estrutura salarial..."
                    }
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={8}
                    className="resize-none"
                    maxLength={maxChars}
                    disabled={loading}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {charCount.toLocaleString()} / {maxChars.toLocaleString()} caracteres
                    </span>
                    {activeMode && (
                      <span className="text-primary font-medium">
                        Modo: {activeMode}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !question.trim()}
                  className="w-full"
                  size="lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Analisando...' : uploadedFile ? 'Analisar Documento' : 'Enviar Análise'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryAssistant;
