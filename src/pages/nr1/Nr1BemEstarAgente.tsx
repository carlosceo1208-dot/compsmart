import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Sparkles, User, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nr1-bem-estar-agent`;

const SUGGESTIONS = [
  'O que mudou na NR-1 para 2026 e quais são minhas obrigações?',
  'Como interpretar um score 65 em "Demandas no Trabalho"?',
  'Monte um plano de ação para reduzir risco em "Relações e Liderança".',
  'Quais evidências preciso ter para uma fiscalização do MTE?',
];

export default function Nr1BemEstarAgente() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
      // Recupera token de autenticação do Supabase
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full nr1-bg-primary flex items-center justify-center">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Bem-Estar
                <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> IA</Badge>
              </CardTitle>
              <CardDescription>Especialista em NR-1, riscos psicossociais e planos de ação</CardDescription>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Nova conversa
            </Button>
          )}
        </CardHeader>
      </Card>

      <Card className="overflow-hidden">
        <ScrollArea className="h-[55vh]" ref={scrollRef as any}>
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center space-y-4 py-8">
                <Brain className="h-10 w-10 mx-auto nr1-text-primary" />
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Olá! Sou o agente Bem-Estar. Posso ajudar com a NR-1, interpretar diagnósticos, montar planos de ação e orientar sobre conformidade legal. Como posso ajudar?
                </p>
                <div className="grid gap-2 max-w-xl mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      className="text-left justify-start h-auto py-2 whitespace-normal"
                      onClick={() => send(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3',
                    m.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={m.role === 'user' ? 'bg-muted' : 'nr1-bg-primary'}>
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 max-w-[85%] text-sm',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted',
                    )}
                  >
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:mt-3 prose-headings:mb-2">
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
              <div className="flex gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="nr1-bg-primary"><Brain className="h-4 w-4" /></AvatarFallback></Avatar>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Pensando…
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <CardContent className="border-t pt-3">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Pergunte sobre NR-1, planos de ação, conformidade…"
              className="min-h-[44px] max-h-32 resize-none"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading} className="nr1-bg-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Respostas geradas por IA. Não substitui aconselhamento médico, jurídico ou do SESMT.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
