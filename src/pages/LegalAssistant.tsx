import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Scale, Send, AlertCircle, History } from 'lucide-react';
import { PlanBadge } from '@/components/PlanBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Conversation {
  id: string;
  question: string;
  answer: string;
  legal_references?: any;
  created_at: string;
}

const LegalAssistant = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('legal_assistant_conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setConversations(data);
    }
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('legal-assistant', {
        body: { question },
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
        description: 'Consulta processada com sucesso',
      });

      setQuestion('');
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
          <PlanBadge plan="pro" />
        </div>

        <Alert className="mb-6 border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            <strong>Aviso Legal:</strong> As respostas fornecidas são para fins informativos e educacionais.
            Não substituem a consulta com um advogado especializado. Sempre consulte um profissional
            jurídico para casos específicos.
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
              <ScrollArea className="h-[500px]">
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

          <Card>
            <CardHeader>
              <CardTitle>Nova Consulta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {conversations.length > 0 && (
                <Card className="bg-accent/50 border-accent">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Última Consulta:</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {conversations[0].question}
                    </p>
                    <p className="text-sm font-medium mb-2">Resposta:</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {conversations[0].answer}
                    </p>
                    {conversations[0].legal_references && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground">
                          Referências Legais
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <Textarea
                  placeholder="Digite sua dúvida sobre legislação trabalhista ou previdenciária...&#10;&#10;Exemplos:&#10;- Qual o prazo para pagamento de férias?&#10;- Como funciona o aviso prévio indenizado?&#10;- Quais são os direitos em caso de demissão sem justa causa?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !question.trim()}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Processando...' : 'Enviar Consulta'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LegalAssistant;
