import { useState, useRef, useEffect } from "react";
import { Send, ThumbsUp, ThumbsDown, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// Avatar replaced with custom divs for better rendering
import { useSupport } from "@/hooks/useSupport";
import { QuickActionsPanel } from "./QuickActionsPanel";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export const SupportChat = () => {
  const { messages, isLoading, sendMessage, quickActions } = useSupport();
  const [input, setInput] = useState("");
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
    <div className="fixed bottom-20 right-6 z-50 flex h-[600px] w-[380px] flex-col rounded-lg border border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-success px-4 py-3 rounded-t-lg">
        <div className="h-10 w-10 border-2 border-white/30 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center flex-shrink-0">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">Smart</h3>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white/20 rounded">
              IA
            </span>
          </div>
          <p className="text-xs text-white/80">Assistente de Suporte</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
            <div className="h-16 w-16 mb-4 border-2 border-primary/20 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="h-8 w-8" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-semibold text-foreground text-lg">Smart</h4>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded">
                IA
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Estou aqui para responder suas dúvidas sobre o CompSmart
            </p>
            {quickActions.length > 0 && (
              <QuickActionsPanel 
                actions={quickActions} 
                onActionClick={handleQuickAction}
              />
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
                  <div className="h-8 w-8 mt-1 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
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
                        className="h-7 w-7 p-0"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
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
                <div className="h-8 w-8 mt-1 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center">
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
      {messages.length > 0 && quickActions.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <QuickActionsPanel 
            actions={quickActions} 
            onActionClick={handleQuickAction}
            compact
          />
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
            placeholder="Digite sua dúvida..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0"
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