import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { RESPOSTA_OPCOES } from '@/lib/nr1';

type Questao = { id: string; enunciado: string; ordem: number };
type Convite = { ciclo_nome: string | null; grupo: string | null; expires_at: string | null; disponivel: boolean; questoes: Questao[] };
const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nr1-questionario-publico`;

function getSubmissionId(token: string) {
  const key = `nr1-submission:${token}`;
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export default function Nr1Responder() {
  const { token = '' } = useParams();
  const [convite, setConvite] = useState<Convite | null>(null);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'sending' | 'done' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resolve', token }), signal: controller.signal })
      .then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.error || 'Link indisponível'); return body as Convite; })
      .then((data) => { setConvite(data); setStatus(data.disponivel ? 'ready' : 'error'); if (!data.disponivel) setError('Este link expirou ou não está mais disponível.'); })
      .catch((e) => { if (e.name !== 'AbortError') { setError(e.message); setStatus('error'); } });
    return () => controller.abort();
  }, [token]);

  const questoes = useMemo(() => convite?.questoes ?? [], [convite]);
  const questao = questoes[index];
  const completa = questoes.length > 0 && Object.keys(respostas).length === questoes.length;

  const enviar = async () => {
    if (!completa) return;
    setStatus('sending');
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit', token, submissionId: getSubmissionId(token), respostas }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Não foi possível enviar');
      setStatus('done');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setStatus('error'); }
  };

  if (status === 'loading') return <main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></main>;
  if (status === 'done') return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><Card className="max-w-lg text-center"><CardContent className="space-y-3 py-10"><CheckCircle2 className="mx-auto h-12 w-12 text-blue-600" /><h1 className="text-2xl font-semibold">Respostas enviadas</h1><p className="text-muted-foreground">Obrigado por participar. Suas respostas foram registradas de forma anônima.</p></CardContent></Card></main>;
  if (status === 'error') return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><Card className="max-w-lg"><CardContent className="flex gap-3 py-8"><AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" /><div><h1 className="font-semibold">Questionário indisponível</h1><p className="mt-1 text-sm text-muted-foreground">{error}</p></div></CardContent></Card></main>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700"><ShieldCheck className="h-4 w-4" />Questionário anônimo</div>
          <CardTitle>{convite?.ciclo_nome}</CardTitle><CardDescription>Grupo: {convite?.grupo}. Nenhum gestor recebe respostas individuais. O envio ocorre somente ao final.</CardDescription>
          <Progress value={questoes.length ? ((index + 1) / questoes.length) * 100 : 0} className="mt-3 h-2" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="text-xs text-muted-foreground">Pergunta {index + 1} de {questoes.length}</div>
          <h2 className="text-lg font-semibold leading-snug">{questao?.enunciado}</h2>
          {questao && <RadioGroup key={questao.id} value={respostas[questao.id]?.toString() ?? ""} onValueChange={(v) => setRespostas((r) => ({ ...r, [questao.id]: Number(v) }))} className="space-y-2">{RESPOSTA_OPCOES.map((opt) => <Label key={opt.value} htmlFor={`nr1-${questao.id}-${opt.value}`} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent"><RadioGroupItem id={`nr1-${questao.id}-${opt.value}`} value={String(opt.value)} /><span>{opt.label}</span></Label>)}</RadioGroup>}
          <div className="flex justify-between gap-3"><Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>Anterior</Button>{index < questoes.length - 1 ? <Button disabled={respostas[questao?.id] == null} onClick={() => setIndex((i) => i + 1)}>Próxima</Button> : <Button disabled={!completa || status === 'sending'} onClick={enviar}>{status === 'sending' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar respostas</Button>}</div>
        </CardContent>
      </Card>
    </main>
  );
}