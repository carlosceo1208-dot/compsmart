import { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDown, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Conversation {
  id?: string;
  question: string;
  answer: string;
  created_at?: string;
  document_name?: string;
  operation_mode?: string;
}

interface AssistantConversationCardProps {
  conversations: Conversation[];
  loading: boolean;
  emptyMessage?: string;
}

export const AssistantConversationCard = ({
  conversations,
  loading,
  emptyMessage = "Nenhuma conversa ainda. Faça uma pergunta para começar!",
}: AssistantConversationCardProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  return (
    <Card className="overflow-hidden min-h-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Conversa Atual</CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="max-h-[600px] overflow-y-auto overscroll-contain px-6 pb-6 scroll-smooth"
          style={{ scrollbarGutter: 'stable' }}
        >
          <div className="space-y-4">
            {conversations.map((conv, index) => (
              <div key={conv.id || index} className="space-y-3">
                {/* Pergunta do usuário */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Você</p>
                    <p className="text-sm whitespace-pre-wrap">{conv.question}</p>
                    {conv.document_name && (
                      <p className="text-xs text-muted-foreground mt-2">
                        📎 {conv.document_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Resposta do assistente */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <Bot className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="flex-1 bg-accent/30 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Assistente</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="text-sm list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="text-sm list-decimal pl-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="text-sm mb-1">{children}</li>,
                          h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          code: ({ children }) => (
                            <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto mb-2">
                              <table className="text-xs w-full border-collapse">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                          th: ({ children }) => (
                            <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-border px-2 py-1">{children}</td>
                          ),
                        }}
                      >
                        {conv.answer}
                      </ReactMarkdown>
                    </div>
                    {conv.operation_mode && conv.operation_mode !== 'consulta' && (
                      <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {conv.operation_mode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <Bot className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1 bg-accent/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Processando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {showScrollButton && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-8 right-8 rounded-full shadow-lg"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
