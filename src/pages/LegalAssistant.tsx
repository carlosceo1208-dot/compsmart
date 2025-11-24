import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
// ScrollArea removido - usando scroll nativo
import { useToast } from '@/hooks/use-toast';
import { Scale, Send, AlertCircle, History, FileText, Gavel, BookOpen, ShieldCheck, Archive, ArrowDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { QuickActions, QuickAction } from '@/components/assistant/QuickActions';
import { DocumentUpload } from '@/components/assistant/DocumentUpload';
import { ContextBadges } from '@/components/assistant/ContextBadges';
import { useLegalSessions } from '@/hooks/useLegalSessions';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  question: string;
  answer: string;
  legal_references?: any;
  document_name?: string;
  operation_mode?: string;
  created_at: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'Validar Contrato',
    prompt: '/validar_politica Cole o texto do contrato ou política que deseja validar',
    icon: Gavel,
    mode: 'validar_politica',
  },
  {
    label: 'Analisar Cláusula',
    prompt: 'Analise a seguinte cláusula contratual sob a ótica da CLT',
    icon: FileText,
  },
  {
    label: 'Interpretar Lei',
    prompt: '/interpretar_lei Explique de forma prática o Art. 58 da CLT sobre jornada de trabalho',
    icon: BookOpen,
    mode: 'interpretar_lei',
  },
  {
    label: 'Compliance Check',
    prompt: '/compliance_check Verifique se nossa política de férias está em conformidade',
    icon: ShieldCheck,
    mode: 'compliance_check',
  },
];

const LegalAssistant = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
  } = useLegalSessions();

  const maxChars = 50000;

  useEffect(() => {
    setCharCount(question.length + documentText.length);
  }, [question, documentText]);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionConversations();
    }
  }, [currentSessionId]);

  // Auto-scroll para última mensagem
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

    // Criar sessão automaticamente se não existir
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('legal-assistant', {
        body: { 
          question,
          document_text: documentText || undefined,
          document_name: documentName || undefined,
          session_id: sessionId,
        },
      });

      if (error) throw error;

      if (data.error) {
        // Tratamento específico para erro 503
        if (data.error.includes('temporariamente indisponível') || data.error.includes('503')) {
          toast({
            title: '⏳ Serviço Temporariamente Indisponível',
            description: 'O assistente está processando muitas requisições. Tente novamente em 10-20 segundos.',
            variant: 'destructive',
            duration: 6000,
          });
        } else {
          toast({
            title: 'Erro',
            description: data.error,
            variant: 'destructive',
          });
        }
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
            <Scale className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Assistente Jurídico</h1>
              <p className="text-muted-foreground">
                Consultoria trabalhista e previdenciária com IA
              </p>
            </div>
          </div>
          <ContextBadges agent="legal" activeMode={activeMode} />
        </div>

        <Alert className="mb-4 border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            <strong>Aviso Legal:</strong> As respostas fornecidas são para fins informativos e educacionais.
            Não substituem a consulta com um advogado especializado. Sempre consulte um profissional
            jurídico para casos específicos.
          </AlertDescription>
        </Alert>

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
                            {conv.answer.length > 500 && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                💡 Role para ver o documento completo
                              </p>
                            )}
                            {conv.legal_references && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Referências Legais
                                </p>
                              </div>
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
                        ? "Digite sua dúvida sobre legislação trabalhista ou previdenciária...\n\nExemplos:\n- Qual o prazo para pagamento de férias?\n- Como funciona o aviso prévio indenizado?\n\nModos especiais:\n/validar_politica - Validar políticas e contratos\n/interpretar_lei - Explicar artigos da lei\n/compliance_check - Verificar conformidade"
                        : "Digite sua próxima pergunta sobre legislação trabalhista ou previdenciária..."
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
                <div className="relative group">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !question.trim()}
                    className="w-full"
                    size="lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? 'Processando...' : uploadedFile ? 'Analisar Documento' : 'Enviar Consulta'}
                  </Button>
                  {!question.trim() && !loading && (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-3 py-1 rounded shadow-lg whitespace-nowrap">
                      Digite uma pergunta para enviar
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalAssistant;
