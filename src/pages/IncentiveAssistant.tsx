import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Target, Send, History, FileText, Sparkles, ShieldCheck } from 'lucide-react';
import { QuickActions, QuickAction } from '@/components/assistant/QuickActions';
import { DocumentUpload } from '@/components/assistant/DocumentUpload';
import { ContextBadges } from '@/components/assistant/ContextBadges';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  const { toast } = useToast();

  const maxChars = 50000;

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    setCharCount(question.length + documentText.length);
  }, [question, documentText]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('incentive_assistant_conversations')
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
      const { data, error } = await supabase.functions.invoke('incentive-assistant', {
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
        title: 'Resposta recebida',
        description: `Consulta processada com sucesso (${data.tokens_used} tokens)`,
      });

      setQuestion('');
      handleFileRemove();
      fetchConversations();
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma consulta ainda
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
              </ScrollArea>
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
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Última Consulta:</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {conversations[0].question}
                  </p>
                  <p className="text-sm font-medium mb-2">Resposta:</p>
                  <ScrollArea className="max-h-[200px]">
                    <p className="text-sm whitespace-pre-wrap pr-4">
                      {conversations[0].answer}
                    </p>
                  </ScrollArea>
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
                    placeholder="Digite sua dúvida sobre remuneração, benefícios ou incentivos...&#10;&#10;Exemplos:&#10;- Como estruturar uma política de PLR?&#10;- Qual a diferença entre ICP e ILP?&#10;- Como calcular compa-ratio?&#10;&#10;Modos especiais:&#10;/gerar_politica - Criar políticas de remuneração&#10;/comparar_mercado - Análise competitiva&#10;/mix_total_rewards - Otimizar pacote de remuneração"
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