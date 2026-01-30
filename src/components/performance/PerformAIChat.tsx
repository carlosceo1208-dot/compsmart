import { useState, useRef, useEffect } from "react";
import { Send, ThumbsUp, ThumbsDown, Loader2, Bot, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePerformAI } from "@/hooks/usePerformAI";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface PerformAIChatProps {
  onClose: () => void;
}

export const PerformAIChat = ({ onClose }: PerformAIChatProps) => {
  const { messages, isLoading, sendMessage, quickActions } = usePerformAI();
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ [key: number]: 'up' | 'down' | null }>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleQuickAction = (question: string) => {
    sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-24 z-50 flex h-[500px] w-[360px] flex-col rounded-lg border border-border bg-background shadow-2xl max-w-[calc(100vw-2rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3 rounded-t-lg">
        <div className="h-10 w-10 border-2 border-white rounded-full bg-white flex items-center justify-center flex-shrink-0">
          <Bot className="h-5 w-5 text-violet-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">PerformAI</h3>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white/20 rounded text-white">
              IA
            </span>
          </div>
          <p className="text-xs text-white/80">Assistente de Desempenho</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
            <div className="h-16 w-16 mb-4 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center flex-shrink-0 shadow-lg">
              <Bot className="h-8 w-8" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sou especialista em Avaliação de Desempenho. Pergunte sobre metas, 9Box, PDI, ciclos e muito mais!
            </p>
            {quickActions.length > 0 && (
              <div className="w-full space-y-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Sparkles className="h-3 w-3" />
                  <span>Perguntas rápidas:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickActions.slice(0, 4).map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.questionText)}
                      className="text-xs h-auto py-1.5 px-3 whitespace-normal text-left border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                    >
                      {action.questionText}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2",
                  message.role === "user" ? "justify-end" : "justify-start items-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 mt-1 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {message.role === "assistant" && index === messages.length - 1 && !isLoading && (
                    <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-2">
                      <span className="text-xs text-muted-foreground">Consegui ajudar?</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFeedback({ ...feedback, [index]: 'up' })}
                        className={cn(
                          "h-7 w-7 p-0 transition-colors",
                          feedback[index] === 'up' && "text-green-600 bg-green-50"
                        )}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFeedback({ ...feedback, [index]: 'down' })}
                        className={cn(
                          "h-7 w-7 p-0 transition-colors",
                          feedback[index] === 'down' && "text-red-600 bg-red-50"
                        )}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start items-start gap-2">
                <div className="h-8 w-8 mt-1 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions (when there are messages) */}
      {messages.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <div className="flex flex-wrap gap-1">
            {quickActions.slice(0, 3).map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction(action.questionText)}
                className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-violet-600"
              >
                {action.questionText}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre desempenho..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0 bg-violet-600 hover:bg-violet-700"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
