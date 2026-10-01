import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { RESPOSTA_OPCOES } from '@/lib/nr1';
import { calcScoreSegPsi, dimensaoLabel, statusSegPsi, type SegPsiQuestao } from '@/lib/nr1SegPsi';
import { calcScoreVitalidade, vitDimLabel, type VitQuestao } from '@/lib/nr1Vitalidade';

type Questao = { id: string; enunciado: string; ordem: number };
type Convite = { ciclo_nome: string | null; grupo: string | null; expires_at: string | null; disponivel: boolean; questoes: Questao[]; questoes_segpsi?: SegPsiQuestao[]; questoes_vitalidade?: VitQuestao[] };
type Item = { id: string; enunciado: string; bloco: 'copsoq' | 'segpsi' | 'vitalidade' };
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
  const [resultado, setResultado] = useState<ReturnType<typeof calcScoreSegPsi> | null>(null);
  const [resultadoVit, setResultadoVit] = useState<ReturnType<typeof calcScoreVitalidade> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resolve', token }), signal: controller.signal })
      .then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.error || 'Link indisponível'); return body as Convite; })
      .then((data) => { setConvite(data); setStatus(data.disponivel ? 'ready' : 'error'); if (!data.disponivel) setError('Este link expirou ou não está mais disponível.'); })
      .catch((e) => { if (e.name !== 'AbortError') { setError(e.message); setStatus('error'); } });
    return () => controller.abort();
  }, [token]);

  const segpsi = useMemo(() => convite?.questoes_segpsi ?? [], [convite]);
  const vitalidade = useMemo(() => convite?.questoes_vitalidade ?? [], [convite]);
  const itens = useMemo<Item[]>(() => [
    ...(convite?.questoes ?? []).map((q) => ({ id: q.id, enunciado: q.enunciado, bloco: 'copsoq' as const })),
    ...segpsi.map((q) => ({ id: q.id, enunciado: q.enunciado, bloco: 'segpsi' as const })),
    // Só itens próprios: os de referência ao COPSOQ já foram respondidos acima e não se repetem.
    ...vitalidade.filter((q) => q.origem === 'propria').map((q) => ({ id: q.id, enunciado: q.enunciado ?? '', bloco: 'vitalidade' as const })),
  ], [convite, segpsi, vitalidade]);
  const questao = itens[index];
  const completa = itens.length > 0 && itens.every((q) => respostas[q.id] != null);

  const enviar = async () => {
    if (!completa) return;
    setStatus('sending');
    const copsoq: Record<string, number> = {};
    const seg: Record<string, number> = {};
    const vit: Record<string, number> = {};
    for (const q of itens) (q.bloco === 'segpsi' ? seg : q.bloco === 'vitalidade' ? vit : copsoq)[q.id] = respostas[q.id];
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit', token, submissionId: getSubmissionId(token), respostas: copsoq, respostasSegPsi: seg, respostasVitalidade: vit }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Não foi possível enviar');
      // Resultado individual calculado só na memória do navegador; nada é salvo com identificação.
      setResultado(calcScoreSegPsi(segpsi, seg));
      setResultadoVit(vitalidade.length ? calcScoreVitalidade(vitalidade, vit, copsoq) : null);
      setRespostas({});
      setStatus('done');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setStatus('error'); }
  };

  if (status === 'loading') return <main className="flex min-h-screen items-center justify-center bg-muted/40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;
  if (status === 'done') {
    const st = resultado ? statusSegPsi(resultado.geral) : null;
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-4 py-8">
            <div className="text-center space-y-2">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h1 className="text-2xl font-semibold">Respostas enviadas</h1>
              <p className="text-muted-foreground">Obrigado por participar. Suas respostas foram registradas de forma anônima.</p>
            </div>
            {resultado && st && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">Sua percepção de Segurança Psicológica</p>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <p className="text-3xl font-semibold tabular-nums">{resultado.geral.toFixed(1)}<span className="text-sm font-normal text-muted-foreground"> / 100</span></p>
                <ul className="space-y-1 text-sm">
                  {Object.entries(resultado.dimensoes).map(([d, v]) => (
                    <li key={d} className="flex justify-between gap-3"><span className="text-muted-foreground">{dimensaoLabel(d)}</span><span className="tabular-nums font-medium">{v.toFixed(1)}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {resultadoVit && (() => { const sv = statusSegPsi(resultadoVit.geral); return (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">Sua Vitalidade</p>
                  <Badge variant={sv.variant}>{sv.label}</Badge>
                </div>
                <p className="text-3xl font-semibold tabular-nums">{resultadoVit.geral.toFixed(1)}<span className="text-sm font-normal text-muted-foreground"> / 100</span></p>
                <ul className="space-y-1 text-sm">
                  {Object.entries(resultadoVit.dimensoes).map(([d, v]) => (
                    <li key={d} className="flex justify-between gap-3"><span className="text-muted-foreground">{vitDimLabel(d)}</span><span className="tabular-nums font-medium">{v.toFixed(1)}</span></li>
                  ))}
                </ul>
              </div>
            ); })()}
            {(resultado || resultadoVit) && <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">Seu resultado é exibido uma única vez e não fica salvo com sua identificação. Ao sair desta página, ele não poderá ser recuperado.</p>}
          </CardContent>
        </Card>
      </main>
    );
  }
  if (status === 'error') return <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4"><Card className="max-w-lg"><CardContent className="flex gap-3 py-8"><AlertTriangle className="h-6 w-6 shrink-0 text-warning" /><div><h1 className="font-semibold">Questionário indisponível</h1><p className="mt-1 text-sm text-muted-foreground">{error}</p></div></CardContent></Card></main>;

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" />Questionário anônimo</div>
          <CardTitle>{convite?.ciclo_nome}</CardTitle><CardDescription>Grupo: {convite?.grupo}. Nenhum gestor recebe respostas individuais. O envio ocorre somente ao final.</CardDescription>
          <Progress value={itens.length ? ((index + 1) / itens.length) * 100 : 0} className="mt-3 h-2" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Pergunta {index + 1} de {itens.length}</span>
            {questao?.bloco === 'segpsi' && <Badge variant="outline">Segurança Psicológica</Badge>}
            {questao?.bloco === 'vitalidade' && <Badge variant="outline">Vitalidade</Badge>}
          </div>
          <h2 className="text-lg font-semibold leading-snug">{questao?.enunciado}</h2>
          {questao && <RadioGroup key={questao.id} value={respostas[questao.id]?.toString() ?? ""} onValueChange={(v) => setRespostas((r) => ({ ...r, [questao.id]: Number(v) }))} className="space-y-2">{RESPOSTA_OPCOES.map((opt) => <Label key={opt.value} htmlFor={`nr1-${questao.id}-${opt.value}`} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent"><RadioGroupItem id={`nr1-${questao.id}-${opt.value}`} value={String(opt.value)} /><span>{opt.label}</span></Label>)}</RadioGroup>}
          <div className="flex justify-between gap-3"><Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>Anterior</Button>{index < itens.length - 1 ? <Button disabled={respostas[questao?.id] == null} onClick={() => setIndex((i) => i + 1)}>Próxima</Button> : <Button disabled={!completa || status === 'sending'} onClick={enviar}>{status === 'sending' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar respostas</Button>}</div>
        </CardContent>
      </Card>
    </main>
  );
}
