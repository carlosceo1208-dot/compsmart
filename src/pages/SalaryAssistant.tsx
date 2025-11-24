import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Send, History, FileText, ShieldCheck, ArrowDown, Bot, TrendingUp, BarChart3, Target, DollarSign } from 'lucide-react';
import { QuickActions, QuickAction } from '@/components/assistant/QuickActions';
import { DocumentUpload } from '@/components/assistant/DocumentUpload';
import { ContextBadges } from '@/components/assistant/ContextBadges';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const { toast } = useToast();

  const maxChars = 50000;

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    setCharCount(question.length + documentText.length);
  }, [question, documentText]);

  useEffect(() => {
    if (conversations.length > 0 && !loading) {
      setShowNewBadge(true);
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
        setTimeout(() => setShowNewBadge(false), 3000);
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

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('salary_assistant_conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setConversations(data);
    }
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

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('salary-assistant', {
        body: { 
          question, 
          document_text: documentText || undefined,
          document_name: documentName || undefined,
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
        title: 'Análise concluída',
        description: `Consulta processada com sucesso (${data.tokens_used} tokens)`,
      });

      setQuestion('');
      handleFileRemove();
      fetchConversations();
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
    <div className="h-[calc(100vh-8rem)] overflow-auto p-6">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] overflow-y-auto scroll-smooth pr-2">
                <div className="space-y-2">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma análise ainda
                    </p>
                  ) : (
                    conversations.map((conv) => (
                      <Card
                        key={conv.id}
                        className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      >
                        <p className="text-sm font-medium line-clamp-2">
                          {conv.question}
                        </p>
                        {conv.operation_mode && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {conv.operation_mode}
                          </Badge>
                        )}
                        {conv.document_name && (
                          <div className="flex items-center gap-1 mt-1">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.document_name}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                        </p>
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

            {conversations.length > 0 && (
              <Card className="bg-accent/30 border-accent">
                <CardHeader>
                  <CardTitle className="text-lg">Última Análise</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div 
                    ref={scrollAreaRef}
                    onScroll={handleScroll}
                    className="max-h-[600px] overflow-y-auto pr-4 scroll-smooth"
                    style={{ scrollbarGutter: 'stable' }}
                  >
                    <div className="space-y-4">
                      {loading && conversations.length > 0 ? (
                        <div className="space-y-2 animate-fade-in">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Bot className="h-4 w-4 animate-pulse" />
                            <span>Analisando dados salariais...</span>
                          </div>
                        </div>
                      ) : loading && conversations.length === 0 ? (
                        <div className="text-center py-8">
                          <Bot className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
                          <p className="text-sm text-muted-foreground">
                            Processando análise salarial...
                          </p>
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className="text-center py-8">
                          <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Faça sua primeira análise para começar
                          </p>
                        </div>
                      ) : (
                        conversations.map((conv, index) => (
                          <div key={index} className="space-y-2">
                            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                              <h4 className="font-medium text-sm flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Consulta:
                              </h4>
                              <p className="text-sm">{conv.question}</p>
                            </div>
                            
                            <div className="bg-primary/10 p-4 rounded-lg space-y-2 relative">
                              {index === conversations.length - 1 && showNewBadge && (
                                <Badge className="absolute -top-2 -right-2 bg-primary animate-pulse">
                                  Nova
                                </Badge>
                              )}
                              <h4 className="font-medium text-sm flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                Análise:
                              </h4>
                              <p className="text-sm whitespace-pre-wrap">{conv.answer}</p>
                              
                              {conv.document_name && (
                                <Badge variant="outline" className="mt-2">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {conv.document_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                  {showScrollButton && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-4 right-8 shadow-lg animate-fade-in"
                      onClick={scrollToBottom}
                    >
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Última análise
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
                <CardTitle>Nova Análise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Digite sua dúvida sobre estrutura salarial, compa-ratio ou benchmarking...&#10;&#10;Exemplos:&#10;- Calcule o compa-ratio dos funcionários&#10;- Compare nossa Grade C com o mercado&#10;- Identifique distorções salariais&#10;&#10;Modos especiais:&#10;/analise_equidade - Análise de equidade interna&#10;/benchmark_mercado - Comparação com mercado&#10;/recomendacao_ajuste - Sugestões de ajustes"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={12}
                    className="resize-none"
                    maxLength={maxChars}
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
