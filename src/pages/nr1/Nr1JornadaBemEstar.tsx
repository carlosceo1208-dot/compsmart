import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, Send, User, Loader2, RotateCcw, PauseCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { JornadaStepper } from '@/components/nr1/JornadaStepper';
import { Nr1GrupoSelect } from '@/components/nr1/Nr1GrupoSelect';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nr1-jornada-agent`;

const KICKOFF = 'Olá! Eu sou o agente Bem-Estar. Estou aqui para te acompanhar nas próximas semanas com cuidado e confidencialidade. Vamos começar?';

export default function Nr1JornadaBemEstar() {
  const navigate = useNavigate();
  const [jornadaId, setJornadaId] = useState<string | null>(null);
  const [momentoAtual, setMomentoAtual] = useState(1);
  const [semanaAtual, setSemanaAtual] = useState(1);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [semJornada, setSemJornada] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [grupo, setGrupo] = useState<string | null>(null);

  const salvarGrupo = async (v: string | null) => {
    setGrupo(v);
    if (!jornadaId) return;
    const { error } = await supabase.from('nr1_jornadas').update({ grupo: v } as any).eq('id', jornadaId);
    if (error) toast.error('Não foi possível salvar o grupo.');
    else toast.success('Grupo atualizado.');
  };

  const carregarMensagens = async (j: any) => {
    setJornadaId(j.id);
    setGrupo(j.grupo ?? null);
    setMomentoAtual(j.momento_atual ?? 1);
    setSemanaAtual(j.semana_atual ?? 1);
    const { data: msgs } = await supabase
      .from('nr1_jornada_mensagens')
      .select('role, content')
      .eq('jornada_id', j.id)
      .order('created_at', { ascending: true });
    setMessages(msgs && msgs.length > 0 ? (msgs as Msg[]) : [{ role: 'assistant', content: KICKOFF }]);
  };

  // Bootstrap: apenas LÊ a jornada ativa. Abrir a tela não grava nada.
  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          toast.error('Faça login para iniciar a jornada.');
          return;
        }
        const { data: existing } = await supabase
          .from('nr1_jornadas')
          .select('*')
          .eq('user_id', userData.user.id)
          .in('status', ['ativa', 'pausada'])
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existing) await carregarMensagens(existing);
        else setSemJornada(true);
      } catch (e: any) {
        console.error(e);
        toast.error('Erro ao carregar jornada.');
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  const iniciarJornada = async () => {
    setIniciando(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: companyId } = await supabase.rpc('get_user_company_id');
      if (!userData?.user || !companyId) {
        toast.error('Empresa ativa não identificada.');
        return;
      }
      const { data: created, error } = await supabase
        .from('nr1_jornadas')
        .insert({ user_id: userData.user.id, company_id: companyId, grupo } as any)
        .select()
        .single();
      if (error || !created) throw error;
      await supabase.from('nr1_jornada_mensagens').insert({
        jornada_id: created.id, role: 'assistant', content: KICKOFF, momento: 1,
      });
      setSemJornada(false);
      await carregarMensagens(created);
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível iniciar a jornada.');
    } finally {
      setIniciando(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading || !jornadaId) return;

    const userMsg: Msg = { role: 'user', content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    // Persiste mensagem do usuário
    await supabase.from('nr1_jornada_mensagens').insert({
      jornada_id: jornadaId, role: 'user', content: trimmed, momento: momentoAtual,
    });

    abortRef.current = new AbortController();
    let assistantSoFar = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next, jornadaId, momentoAtual, semanaAtual }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error('Muitas requisições. Aguarde alguns instantes.');
        else if (resp.status === 402) toast.error('Créditos esgotados.');
        else if (resp.status === 401) toast.error('Sessão expirada.');
        else toast.error('Erro ao conversar com o agente.');
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

      // Persiste resposta final do assistente
      if (assistantSoFar) {
        await supabase.from('nr1_jornada_mensagens').insert({
          jornada_id: jornadaId, role: 'assistant', content: assistantSoFar, momento: momentoAtual,
        });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(e);
        toast.error('Erro ao conversar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const avancarMomento = async () => {
    if (!jornadaId || momentoAtual >= 8) return;
    const novo = momentoAtual + 1;
    setMomentoAtual(novo);
    await supabase.from('nr1_jornadas').update({ momento_atual: novo }).eq('id', jornadaId);
    toast.success(`Avançado para o momento ${novo} de 8.`);
  };

  const pausarJornada = async () => {
    if (!jornadaId) return;
    await supabase.from('nr1_jornadas').update({ status: 'pausada' }).eq('id', jornadaId);
    toast.success('Jornada pausada. Você pode retomar quando quiser.');
  };

  const novaConversa = () => {
    abortRef.current?.abort();
    setMessages([{ role: 'assistant', content: KICKOFF }]);
  };

  const isQuickReply = (txt: string) => /\(0=.*?\/\s*3=.*?\)|\(0=.*?\/\s*4=.*?\)|\(1=.*?\/\s*10=/i.test(txt);
  const lastAssistant = messages[messages.length - 1];
  const showQuickReplies = lastAssistant?.role === 'assistant' && isQuickReply(lastAssistant.content) && !loading;
  const quickRange: number[] = lastAssistant?.content.includes('1=')
    ? Array.from({ length: 10 }, (_, i) => i + 1)
    : lastAssistant?.content.includes('0=') && lastAssistant?.content.includes('4=')
      ? [0, 1, 2, 3, 4]
      : [0, 1, 2, 3];

  if (bootstrapping) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin nr1-text-primary" />
      </div>
    );
  }

  if (semJornada) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 nr1-text-primary" /> Minha Jornada</CardTitle>
          <CardDescription>
            Uma conversa guiada de 12 semanas para cuidar do seu bem-estar no trabalho. Só você vê o que escreve aqui.
            Nada é gravado até você clicar em "Iniciar minha jornada".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Nr1GrupoSelect value={grupo} onChange={setGrupo} disabled={iniciando} />
          <Button onClick={iniciarJornada} disabled={iniciando} className="nr1-bg-primary text-white">
            {iniciando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Heart className="h-4 w-4 mr-2" />}
            Iniciar minha jornada
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <Nr1GrupoSelect value={grupo} onChange={salvarGrupo} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full nr1-bg-primary flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Minha Jornada de Bem-Estar
                <Badge variant="outline">12 semanas</Badge>
              </CardTitle>
              <CardDescription>
                Acompanhamento empático, confidencial e no seu ritmo.
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/nr1/acompanhamento')}>
              Ir para check-in semanal
            </Button>
            <Button variant="ghost" size="sm" onClick={pausarJornada}>
              <PauseCircle className="h-4 w-4 mr-1" /> Pausar
            </Button>
            <Button variant="ghost" size="sm" onClick={novaConversa}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reiniciar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <JornadaStepper momentoAtual={momentoAtual} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <ScrollArea className="h-[50vh]" ref={scrollRef as any}>
          <div className="p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={m.role === 'user' ? 'bg-muted' : 'nr1-bg-primary text-white'}>
                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  'rounded-lg px-3 py-2 max-w-[85%] text-sm',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                )}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5">
                      <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="nr1-bg-primary text-white"><Heart className="h-4 w-4" /></AvatarFallback></Avatar>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Pensando…
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <CardContent className="border-t pt-3 space-y-2">
          {showQuickReplies && (
            <div className="flex flex-wrap gap-1.5">
              {quickRange.map((n) => (
                <Button key={n} size="sm" variant="outline" onClick={() => send(String(n))}>
                  {n}
                </Button>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              placeholder="Escreva como você está se sentindo…"
              className="min-h-[44px] max-h-32 resize-none"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading} className="nr1-bg-primary text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tudo é confidencial. Você pode pausar ou encerrar quando quiser.</span>
            {momentoAtual < 8 && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={avancarMomento}>
                Avançar para o próximo momento →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
