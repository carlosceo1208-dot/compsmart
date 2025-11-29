import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Target, Send, History, FileText, Sparkles, ShieldCheck, ArrowDown, Bot, Archive } from 'lucide-react';
import { QuickActions, QuickAction } from '@/components/assistant/QuickActions';
import { DocumentUpload } from '@/components/assistant/DocumentUpload';
import { ContextBadges } from '@/components/assistant/ContextBadges';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useIncentiveAssistantSessions } from '@/hooks/useIncentiveAssistantSessions';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  question: string;
  answer: string;
  document_name?: string;
  operation_mode?: string;
  created_at: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'Criar PLR',
    prompt: '/gerar_politica Crie uma política de PLR para uma empresa de tecnologia com 200 funcionários',
    icon: Sparkles,
    mode: 'gerar_politica',
  },
  {
    label: 'Revisar Tabela Salarial',
    prompt: '/comparar_mercado Analise a competitividade da nossa tabela salarial para cargos de TI',
    icon: FileText,
    mode: 'comparar_mercado',
  },
  {
    label: 'Mix Total Rewards',
    prompt: '/mix_total_rewards Avalie o nosso pacote de remuneração total e sugira otimizações',
    icon: Target,
    mode: 'mix_total_rewards',
  },
  {
    label: 'Descrever Cargo',
    prompt: 'Como criar uma descrição de cargo estruturada usando metodologia Hay?',
    icon: FileText,
  },
];

const IncentiveAssistant = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [charCount, setCharCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { toast } = useToast();

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    showArchived,
    setShowArchived,
    createNewSession,
    archiveSession,
    fetchSessionConversations,
    refreshSessions,
  } = useIncentiveAssistantSessions();

  const maxChars = 50000;

  useEffect(() => {
    setCharCount(question.length + documentText.length);
  }, [question, documentText]);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionConversations();
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (conversations.length > 0 && !loading) {
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [conversations, loading]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    const isNearBottom = scrollBottom < 100;
    setShowScrollButton(!isNearBottom && conversations.length > 0);
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      setShowScrollButton(false);
    }
  };

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
      const { data, error } = await supabase.functions.invoke('incentive-assistant', {
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

      toast({
        title: 'Resposta recebida',
        description: `Consulta processada com sucesso (${data.tokens_used} tokens)`,
      });

      setQuestion('');
      handleFileRemove();
      await loadSessionConversations();
      refreshSessions();
    } catch (error: any) {
      toast({
        title: 'Erro ao processar consulta',
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
    <div className="h-[calc(100vh-8rem)] overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Assistente de R&B</h1>
              <p className="text-muted-foreground">
                Consultoria em Remuneração, Benefícios e Incentivos
              </p>
            </div>
          </div>
          <ContextBadges agent="incentive" activeMode={activeMode} />
        </div>

        <Alert className="mb-6 border-green-500/50 bg-green-500/10">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <AlertTitle>Privacidade e Segurança</AlertTitle>
          <AlertDescription>
            Todas as consultas e análises são privadas e isoladas. 
            Seus dados nunca são compartilhados com outras empresas.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5" />
                Sessões
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  {showArchived ? 'Ativas' : 'Arquivadas'}
                </Button>
                <Button
                  size="sm"
                  onClick={createNewSession}
                >
                  + Nova
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] overflow-y-auto scroll-smooth pr-2">
                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {showArchived ? 'Nenhuma sessão arquivada' : 'Nenhuma sessão ativa'}
                    </p>
                  ) : (
                    sessions.map((session) => (
                      <Card
                        key={session.id}
                        className={cn(
                          "p-3 cursor-pointer transition-colors",
                          currentSessionId === session.id 
                            ? "border-primary bg-accent" 
                            : "hover:bg-accent"
                        )}
                        onClick={() => setCurrentSessionId(session.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">
                              {session.title || 'Sem título'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {session.message_count} mensagens
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.last_message_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveSession(session.id);
                            }}
                            className="shrink-0 h-8 w-8 p-0"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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

            {currentSessionId && conversations.length > 0 && (
              <Card className="bg-accent/30 border-accent">
                <CardHeader>
                  <CardTitle className="text-lg">Conversa Atual</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div 
                    ref={scrollAreaRef}
                    onScroll={handleScroll}
                    className="max-h-[600px] overflow-y-auto pr-4 scroll-smooth"
                    style={{ scrollbarGutter: 'stable' }}
                  >
                    <div className="space-y-4">
                      {loading && conversations.length > 0 && (
                        <div className="space-y-2 animate-fade-in">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-12 w-full" />
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <Skeleton className="h-4 w-16 mb-2" />
                            <div className="flex items-center gap-2">
                              <span className="animate-pulse text-xs">●</span>
                              <span className="animate-pulse text-xs" style={{ animationDelay: '0.2s' }}>●</span>
                              <span className="animate-pulse text-xs" style={{ animationDelay: '0.4s' }}>●</span>
                              <span className="text-xs text-muted-foreground ml-2">Smart está analisando...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {conversations.map((conv, index) => (
                        <div key={conv.id} className="space-y-2 animate-fade-in">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Você:</p>
                            <p className="text-sm">{conv.question}</p>
                            {conv.document_name && (
                              <div className="flex items-center gap-1 mt-2">
                                <FileText className="w-3 h-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">{conv.document_name}</p>
                              </div>
                            )}
                          </div>
                          <div className="bg-muted p-3 rounded-lg relative">
                            {index === conversations.length - 1 && !loading && (
                              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full animate-pulse shadow-lg">
                                Nova
                              </span>
                            )}
                            <p className="text-xs font-medium text-muted-foreground mb-1">Smart:</p>
                            <p className="text-sm whitespace-pre-wrap">{conv.answer}</p>
                            {conv.operation_mode && (
                              <Badge variant="outline" className="mt-2">
                                {conv.operation_mode}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                  {showScrollButton && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-4 right-8 shadow-lg animate-fade-in z-10"
                      onClick={scrollToBottom}
                    >
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Última mensagem
                    </Button>
                  )}
                </CardContent>
              </Card>
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
                <CardTitle>Nova Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder={
                      conversations.length === 0 
                        ? "Digite sua dúvida sobre remuneração, benefícios ou incentivos...\n\nExemplos:\n- Como estruturar uma política de PLR?\n- Qual a diferença entre ICP e ILP?\n- Como calcular compa-ratio?\n\nModos especiais:\n/gerar_politica - Criar políticas de remuneração\n/comparar_mercado - Análise competitiva\n/mix_total_rewards - Otimizar pacote de remuneração"
                        : "Digite sua próxima pergunta sobre remuneração, benefícios ou incentivos..."
                    }
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={12}
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
                  {loading ? 'Processando...' : uploadedFile ? 'Analisar Documento' : 'Enviar Consulta'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncentiveAssistant;
