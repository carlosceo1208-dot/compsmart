import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Scale, Send, AlertCircle, FileText, Gavel, BookOpen, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QuickActions, QuickAction } from '@/components/assistant/QuickActions';
import { DocumentUpload } from '@/components/assistant/DocumentUpload';
import { ContextBadges } from '@/components/assistant/ContextBadges';
import { AssistantSessionSidebar } from '@/components/assistant/AssistantSessionSidebar';
import { AssistantConversationCard } from '@/components/assistant/AssistantConversationCard';
import { useAssistantSessions } from '@/hooks/useAssistantSessions';

interface Conversation {
  id?: string;
  question: string;
  answer: string;
  legal_references?: any;
  document_name?: string;
  operation_mode?: string;
  created_at?: string;
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
  } = useAssistantSessions('legal');

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

    const userQuestion = question;
    const userDocName = documentName || undefined;

    // Placeholder otimista (resposta vazia que será preenchida via streaming)
    setConversations(prev => [
      ...prev,
      {
        question: userQuestion,
        answer: '',
        document_name: userDocName,
        created_at: new Date().toISOString(),
      } as Conversation,
    ]);
    setQuestion('');

    setLoading(true);
    try {
      const { streamAssistant } = await import('@/lib/streamAssistant');
      const meta = await streamAssistant({
        functionName: 'legal-assistant',
        body: {
          question: userQuestion,
          document_text: documentText || undefined,
          document_name: userDocName,
          session_id: sessionId,
        },
        onDelta: (chunk) => {
          setConversations(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last) next[next.length - 1] = { ...last, answer: (last.answer || '') + chunk };
            return next;
          });
        },
        onError: (msg, status) => {
          let userMessage = msg;
          if (status === 429) userMessage = 'Muitas requisições. Aguarde alguns minutos e tente novamente.';
          else if (status === 402) userMessage = 'Créditos de IA insuficientes. Entre em contato com o administrador.';
          else if (status === 401) userMessage = 'Sessão expirada. Por favor, faça login novamente.';
          toast({ title: 'Erro', description: userMessage, variant: 'destructive' });
          // remove placeholder
          setConversations(prev => prev.slice(0, -1));
        },
      });

      if (meta) {
        setConversations(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last) {
            next[next.length - 1] = {
              ...last,
              answer: meta.answer ?? last.answer,
              operation_mode: meta.operation_mode,
              legal_references: meta.legal_references,
            } as Conversation;
          }
          return next;
        });
        toast({
          title: 'Resposta recebida',
          description: `Consulta processada com sucesso${meta.tokens_used ? ` (${meta.tokens_used} tokens)` : ''}`,
        });
      }

      handleFileRemove();
      refreshSessions();
    } catch (error: any) {
      // onError já tratou a UI; aqui só garantimos remoção do placeholder se ainda existir
      console.error('[LegalAssistant] streaming error:', error);
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
            <Scale className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Jurídico Smart</h1>
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
            Não substituem a consulta com um advogado especializado.
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

export default LegalAssistant;
