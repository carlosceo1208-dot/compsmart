import { useEffect, useMemo, useState } from 'react';
import { History, Minus, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';
import { compararCiclos, K_MINIMO, LIMIAR_TENDENCIA, notaSaude, seloSaude, type Tendencia } from '@/lib/nr1Selo';
import { cn } from '@/lib/utils';

export interface CicloComparavel {
  id: string;
  ciclo_nome: string;
  status: string;
  score_geral: number | null;
  total_respondentes: number;
  scores_dimensao: unknown;
}

const fmt = (v: number | null) => (v == null ? '—' : v.toFixed(1).replace('.', ','));
const comparavel = (c: CicloComparavel) => (c.total_respondentes ?? 0) >= K_MINIMO && c.score_geral != null;

function tendenciaDe(delta: number | null): Tendencia {
  if (delta == null) return 'nao_comparavel';
  return delta >= LIMIAR_TENDENCIA ? 'evolucao' : delta <= -LIMIAR_TENDENCIA ? 'piora' : 'estavel';
}

function Delta({ delta }: { delta: number | null }) {
  const t = tendenciaDe(delta);
  if (delta == null) return null;
  return (
    <span className={cn('ml-1 text-xs whitespace-nowrap',
      t === 'evolucao' && 'text-[hsl(var(--nr1-success))]',
      t === 'piora' && 'text-[hsl(var(--nr1-danger))]',
      t === 'estavel' && 'text-muted-foreground')}>
      {t === 'evolucao' ? '↑' : t === 'piora' ? '↓' : '='} {delta > 0 ? '+' : ''}{fmt(delta)}
    </span>
  );
}

/** Comparador de ciclos na escala de nota de saúde (100 − risco). A = base, B = comparado. */
export function Nr1ComparadorCiclos({ ciclos }: { ciclos: CicloComparavel[] }) {
  // ciclos chegam do mais recente para o mais antigo
  const concluidos = useMemo(() => ciclos.filter((c) => c.status === 'concluido'), [ciclos]);
  const validos = useMemo(() => concluidos.filter(comparavel), [concluidos]);
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  useEffect(() => {
    if (validos.length >= 2 && !aId && !bId) {
      setBId(validos[0].id);
      setAId(validos[1].id);
    }
  }, [validos, aId, bId]);

  const a = concluidos.find((c) => c.id === aId);
  const b = concluidos.find((c) => c.id === bId);
  const r = a && b ? compararCiclos(a, b) : null;

  const item = (c: CicloComparavel, outro: string) => (
    <SelectItem key={c.id} value={c.id} disabled={c.id === outro || !comparavel(c)}>
      {c.ciclo_nome}{!comparavel(c) ? ` · não comparável (${c.total_respondentes} resp.)` : ''}
    </SelectItem>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 nr1-text-primary" />
        <h3 className="text-base font-semibold">Comparar ciclos</h3>
      </div>

      {validos.length < 2 ? (
        <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/20 text-sm text-muted-foreground">
          <History className="h-4 w-4 shrink-0" />
          <span>
            É preciso ter 2 ciclos concluídos com pelo menos {K_MINIMO} respostas para comparar.
            {concluidos.length > validos.length && ` ${concluidos.length - validos.length} ciclo(s) concluído(s) com menos de ${K_MINIMO} respostas não entram na comparação.`}
          </span>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Ciclo base (A)</Label>
              <Select value={aId} onValueChange={setAId}>
                <SelectTrigger aria-label="Ciclo base (A)"><SelectValue placeholder="Ciclo base (A)" /></SelectTrigger>
                <SelectContent>{concluidos.map((c) => item(c, bId))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ciclo comparado (B)</Label>
              <Select value={bId} onValueChange={setBId}>
                <SelectTrigger aria-label="Ciclo comparado (B)"><SelectValue placeholder="Ciclo comparado (B)" /></SelectTrigger>
                <SelectContent>{concluidos.map((c) => item(c, aId))}</SelectContent>
              </Select>
            </div>
          </div>

          {a && b && r && (
            <>
              {r.tendencia === 'nao_comparavel' ? (
                <p className="text-sm text-muted-foreground p-3 rounded-md border">Um dos ciclos tem menos de {K_MINIMO} respostas: não comparável.</p>
              ) : (
                <div className={cn('flex items-start gap-3 p-3 rounded-md border',
                  r.tendencia === 'evolucao' && 'border-[hsl(var(--nr1-success)/0.4)] bg-[hsl(var(--nr1-success)/0.08)]',
                  r.tendencia === 'piora' && 'border-[hsl(var(--nr1-danger)/0.4)] bg-[hsl(var(--nr1-danger)/0.08)]',
                  r.tendencia === 'estavel' && 'bg-muted/30')}>
                  {r.tendencia === 'evolucao' ? <TrendingUp className="h-5 w-5 text-[hsl(var(--nr1-success))] shrink-0" /> :
                    r.tendencia === 'piora' ? <TrendingDown className="h-5 w-5 text-[hsl(var(--nr1-danger))] shrink-0" /> :
                    <Minus className="h-5 w-5 text-muted-foreground shrink-0" />}
                  <div className="text-sm">
                    <p className="font-semibold">
                      {r.tendencia === 'evolucao' && `Evolução positiva: nota de saúde +${fmt(r.delta)} pontos`}
                      {r.tendencia === 'piora' && `Piora: nota de saúde ${fmt(r.delta)} pontos`}
                      {r.tendencia === 'estavel' && 'Estável: variação dentro de ±0,5 ponto'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Base <strong>{a.ciclo_nome}</strong> → comparado <strong>{b.ciclo_nome}</strong>.
                      {r.tendencia === 'evolucao' && ' O plano de ação demonstra efetividade — mantenha as iniciativas.'}
                      {r.tendencia === 'piora' && ' Reavalie o plano de ação e identifique novas causas raiz nas dimensões que caíram.'}
                      {r.tendencia === 'estavel' && ' Considere ações mais incisivas nas dimensões críticas.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-md border overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="bg-muted/50 text-xs">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Métrica</th>
                      <th className="text-center px-3 py-2 font-medium">A · {a.ciclo_nome}</th>
                      <th className="text-center px-3 py-2 font-medium">B · {b.ciclo_nome}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">Nota de saúde</td>
                      <td className="px-3 py-2 text-center tabular-nums">{fmt(r.saudeA)} {seloSaude(r.saudeA)?.label ?? ''}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{fmt(r.saudeB)} {seloSaude(r.saudeB)?.label ?? ''}<Delta delta={r.delta} /></td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">Respondentes</td>
                      <td className="px-3 py-2 text-center tabular-nums">{a.total_respondentes}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{b.total_respondentes}</td>
                    </tr>
                    {r.tendencia !== 'nao_comparavel' && a.scores_dimensao && b.scores_dimensao && (
                      <>
                        <tr className="border-t bg-muted/30"><td colSpan={3} className="px-3 py-2 text-xs font-medium">Por dimensão (nota de saúde)</td></tr>
                        {Array.from(new Set([...Object.keys(a.scores_dimensao as object), ...Object.keys(b.scores_dimensao as object)])).map((dim) => {
                          const ra = (a.scores_dimensao as Record<string, number>)[dim];
                          const rb = (b.scores_dimensao as Record<string, number>)[dim];
                          const sa = notaSaude(ra);
                          const sb = notaSaude(rb);
                          const d = typeof ra === 'number' && typeof rb === 'number' ? Math.round((ra - rb) * 100) / 100 : null;
                          return (
                            <tr key={dim} className="border-t">
                              <td className="px-3 py-2 text-muted-foreground">{DIMENSAO_LABEL[dim as Dimensao] ?? dim}</td>
                              <td className="px-3 py-2 text-center tabular-nums">{fmt(sa)}</td>
                              <td className="px-3 py-2 text-center tabular-nums">{fmt(sb)}<Delta delta={d} /></td>
                            </tr>
                          );
                        })}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
