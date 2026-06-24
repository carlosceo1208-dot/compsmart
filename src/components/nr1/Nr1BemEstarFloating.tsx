import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, X, Send, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nr1-bem-estar-agent`;

const SUGGESTIONS = [
  'O que mudou na NR-1 para 2026?',
  'Como interpretar score 65 em "Demandas no Trabalho"?',
  'Monte um plano de ação rápido para risco em Liderança.',
  'Quais evidências preciso ter para o MTE?',
];

export const Nr1BemEstarFloating = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Msg = { role: 'user', content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    abortRef.current = new AbortController();
    let assistantSoFar = '';

    try {
      const sessionStr = localStorage.getItem('sb-fpkjkqdfufhhicxkyqdw-auth-token');
      const token = sessionStr ? JSON.parse(sessionStr)?.access_token : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error('Muitas requisições. Aguarde alguns instantes.');
        else if (resp.status === 402) toast.error('Créditos esgotados na sua workspace.');
        else if (resp.status === 401) toast.error('Sessão expirada. Faça login novamente.');
        else toast.error('Erro ao iniciar conversa');
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(e);
        toast.error('Erro ao conversar com o agente');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput('');
  };

  return (
    <>
      <TooltipProvider>
        <div className="fixed bottom-6 right-6 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setOpen(!open)}
                size="lg"
                aria-label="Agente Bem-Estar"
                className={cn(
                  'h-14 w-14 rounded-full shadow-xl transition-all hover:scale-110',
                  'bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900'
                )}
              >
                {open ? <X className="h-6 w-6 text-white" /> : <Bot className="h-7 w-7 text-white" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{open ? 'Fechar' : 'Bem-Estar · Agente IA NR-1'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(92vw,420px)] h-[min(80vh,600px)] bg-card border-2 border-purple-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  Bem-Estar
                  <Badge className="bg-white/20 hover:bg-white/20 text-white border-0 text-[10px] gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> IA
                  </Badge>
                </div>
                <div className="text-[11px] opacity-90 truncate">Especialista NR-1 · Riscos Psicossociais</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={reset} className="h-8 w-8 text-white hover:bg-white/20" aria-label="Nova conversa">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 text-white hover:bg-white/20" aria-label="Fechar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef as any}>
            <div className="p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center space-y-3 py-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 mx-auto flex items-center justify-center">
                    <Bot className="h-6 w-6 text-purple-700" />
                  </div>
                  <p className="text-xs text-muted-foreground px-2">
                    Olá! Sou o <strong>Bem-Estar</strong>. Pergunte sobre NR-1, COPSOQ-III, planos de ação, conformidade legal ou interpretação de diagnósticos.
                  </p>
                  <div className="grid gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto py-1.5 px-2 text-[11px] whitespace-normal border-purple-200 hover:bg-purple-50 hover:border-purple-400"
                        onClick={() => send(s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className={m.role === 'user' ? 'bg-muted text-xs' : 'bg-purple-700 text-white'}>
                        {m.role === 'user' ? 'EU' : <Bot className="h-3.5 w-3.5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      'rounded-lg px-2.5 py-1.5 max-w-[85%] text-xs',
                      m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-muted',
                    )}>
                      {m.role === 'assistant' ? (
                        <div className="prose prose-xs dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:mt-2 prose-headings:mb-1 prose-headings:text-sm">
                          <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2">
                  <Avatar className="h-7 w-7"><AvatarFallback className="bg-purple-700 text-white"><Bot className="h-3.5 w-3.5" /></AvatarFallback></Avatar>
                  <div className="bg-muted rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Pensando…
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-2.5 bg-background">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
                }}
                placeholder="Pergunte ao Bem-Estar…"
                className="min-h-[38px] max-h-24 resize-none text-xs"
                disabled={loading}
              />
              <Button type="submit" disabled={!input.trim() || loading} size="icon" className="bg-purple-700 hover:bg-purple-800 shrink-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-1 px-1">
              Respostas por IA. Não substitui SESMT/médico do trabalho.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
