import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNr1Diagnosticos } from '@/hooks/useNr1';
import { Nr1EmptyState } from '@/components/nr1/Nr1EmptyState';

// 13 fatores de risco psicossocial (NR-1) com correlação às 6 dimensões do COPSOQ-III
// (mesmas dimensões usadas em scores_dimensao do diagnóstico)
type Dim =
  | 'demandas_trabalho'
  | 'organizacao_conteudo'
  | 'relacoes_lideranca'
  | 'interface_trabalho_individuo'
  | 'valores_trabalho'
  | 'saude_bem_estar';

interface Fator {
  nome: string;
  severidade: 1 | 2 | 3 | 4 | 5;
  dimensoes: Dim[];
}

// Severidade base (gravidade clínica/legal) — escala 1–5
const FATORES: Fator[] = [
  { nome: 'Eventos violentos ou traumáticos', severidade: 5, dimensoes: ['saude_bem_estar', 'relacoes_lideranca'] },
  { nome: 'Assédio de qualquer natureza no trabalho', severidade: 5, dimensoes: ['relacoes_lideranca', 'saude_bem_estar'] },
  { nome: 'Excesso de demandas no trabalho (sobrecarga)', severidade: 4, dimensoes: ['demandas_trabalho', 'saude_bem_estar'] },
  { nome: 'Baixa justiça organizacional', severidade: 4, dimensoes: ['valores_trabalho'] },
  { nome: 'Baixo controle no trabalho / Falta de autonomia', severidade: 4, dimensoes: ['organizacao_conteudo'] },
  { nome: 'Falta de suporte/apoio no trabalho', severidade: 3, dimensoes: ['relacoes_lideranca'] },
  { nome: 'Maus relacionamentos no local de trabalho', severidade: 3, dimensoes: ['relacoes_lideranca'] },
  { nome: 'Baixas recompensas e reconhecimento', severidade: 3, dimensoes: ['valores_trabalho', 'relacoes_lideranca'] },
  { nome: 'Má gestão de mudanças organizacionais', severidade: 3, dimensoes: ['organizacao_conteudo', 'valores_trabalho'] },
  { nome: 'Baixa clareza de papel/função', severidade: 2, dimensoes: ['organizacao_conteudo'] },
  { nome: 'Trabalho em condições de difícil comunicação', severidade: 2, dimensoes: ['organizacao_conteudo', 'relacoes_lideranca'] },
  { nome: 'Trabalho remoto e isolado', severidade: 2, dimensoes: ['interface_trabalho_individuo', 'relacoes_lideranca'] },
  { nome: 'Baixa demanda no trabalho (subcarga)', severidade: 1, dimensoes: ['demandas_trabalho', 'organizacao_conteudo'] },
];

const PROB_LABELS = ['Raro', 'Improvável', 'Possível', 'Provável', 'Quase certo'];
const SEV_LABELS = ['Insignificante', 'Menor', 'Moderada', 'Maior', 'Catastrófica'];

function classRisco(r: number) {
  if (r <= 4) return { label: 'Baixo', bg: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300', text: 'text-emerald-900' };
  if (r <= 9) return { label: 'Moderado', bg: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300', text: 'text-yellow-900' };
  if (r <= 15) return { label: 'Alto', bg: 'bg-orange-200 hover:bg-orange-300 border-orange-400', text: 'text-orange-900' };
  return { label: 'Crítico', bg: 'bg-red-200 hover:bg-red-300 border-red-400', text: 'text-red-900' };
}

export function Nr1MatrizRisco() {
  const { data: diagnosticos } = useNr1Diagnosticos();
  const [selectedCell, setSelectedCell] = useState<{ s: number; p: number } | null>(null);

  const ultimo = diagnosticos?.find((d) => d.status === 'concluido');
  const scores = (ultimo?.scores_dimensao as Record<string, number> | null) ?? null;

  const fatoresCalc = useMemo(() => {
    return FATORES.map((f) => {
      let probabilidade: number;
      if (scores) {
        const vals = f.dimensoes
          .map((d) => Number(scores[d] ?? 0))
          .filter((v) => !Number.isNaN(v));
        const media = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        probabilidade = Math.max(1, Math.min(5, Math.ceil(media / 20)));
      } else {
        probabilidade = 1;
      }
      const risco = f.severidade * probabilidade;
      return { ...f, probabilidade, risco };
    });
  }, [scores]);

  // matrix[s][p] (1-indexed) → fatores
  const matriz = useMemo(() => {
    const m: Record<string, typeof fatoresCalc> = {};
    fatoresCalc.forEach((f) => {
      const k = `${f.severidade}-${f.probabilidade}`;
      (m[k] ??= []).push(f);
    });
    return m;
  }, [fatoresCalc]);

  if (!ultimo) {
    return (
      <Nr1EmptyState
        titulo="Sem diagnóstico para gerar a matriz"
        descricao="Conclua um diagnóstico (questionário de 40 perguntas) para que a matriz de risco seja calculada automaticamente."
      />
    );
  }

  const sevRows = [5, 4, 3, 2, 1] as const;
  const probCols = [1, 2, 3, 4, 5] as const;
  const cellFatores = selectedCell ? matriz[`${selectedCell.s}-${selectedCell.p}`] ?? [] : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Risco 5×5 — Severidade × Probabilidade</CardTitle>
          <CardDescription>
            Os 13 fatores de risco psicossocial da NR-1 são posicionados na matriz com base no questionário de 40 perguntas.
            <strong> Probabilidade</strong> é derivada do score COPSOQ das dimensões correlatas; <strong>Severidade</strong> é
            atribuída pela gravidade clínica/legal do fator. Clique numa célula para ver os fatores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Eixo Y label */}
              <div className="flex">
                <div className="w-24 shrink-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-muted-foreground -rotate-90 whitespace-nowrap">SEVERIDADE →</span>
                </div>
                <div className="flex-1">
                  <table className="w-full border-collapse">
                    <tbody>
                      {sevRows.map((s) => (
                        <tr key={s}>
                          <td className="text-[11px] font-semibold text-muted-foreground pr-2 text-right whitespace-nowrap w-32">
                            {s} · {SEV_LABELS[s - 1]}
                          </td>
                          {probCols.map((p) => {
                            const fatores = matriz[`${s}-${p}`] ?? [];
                            const risco = s * p;
                            const cls = classRisco(risco);
                            const isSelected = selectedCell?.s === s && selectedCell?.p === p;
                            return (
                              <td key={p} className="p-1 align-top">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCell(isSelected ? null : { s, p })}
                                  className={cn(
                                    'w-full h-20 rounded-md border-2 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer',
                                    cls.bg,
                                    cls.text,
                                    isSelected && 'ring-2 ring-offset-1 ring-primary',
                                  )}
                                >
                                  <span className="text-lg font-bold tabular-nums">{risco}</span>
                                  {fatores.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                      {fatores.length} fator{fatores.length > 1 ? 'es' : ''}
                                    </Badge>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td></td>
                        {probCols.map((p) => (
                          <td key={p} className="text-[11px] font-semibold text-muted-foreground text-center pt-2">
                            {p} · {PROB_LABELS[p - 1]}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td></td>
                        <td colSpan={5} className="text-center pt-1">
                          <span className="text-xs font-semibold text-muted-foreground">← PROBABILIDADE</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-2 mt-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" /> Baixo (1–4)</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" /> Moderado (5–9)</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-orange-200 border border-orange-400" /> Alto (10–15)</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-200 border border-red-400" /> Crítico (16–25)</span>
          </div>

          {/* Painel da célula selecionada */}
          {selectedCell && (
            <div className="mt-4 p-3 rounded-md border bg-muted/30">
              <p className="text-sm font-semibold mb-2">
                Célula S={selectedCell.s} × P={selectedCell.p} · Risco={selectedCell.s * selectedCell.p} ({classRisco(selectedCell.s * selectedCell.p).label})
              </p>
              {cellFatores.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum fator nesta célula.</p>
              ) : (
                <ul className="space-y-1">
                  {cellFatores.map((f) => (
                    <li key={f.nome} className="text-sm">• {f.nome}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela auxiliar */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento dos 13 Fatores</CardTitle>
          <CardDescription>Severidade (S), Probabilidade (P) e Risco (S×P) calculados para o último ciclo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Fator de risco (NR-1)</th>
                  <th className="text-center px-3 py-2 font-semibold w-16">S</th>
                  <th className="text-center px-3 py-2 font-semibold w-16">P</th>
                  <th className="text-center px-3 py-2 font-semibold w-20">Risco</th>
                  <th className="text-left px-3 py-2 font-semibold w-28">Classificação</th>
                </tr>
              </thead>
              <tbody>
                {[...fatoresCalc].sort((a, b) => b.risco - a.risco).map((f, i) => {
                  const cls = classRisco(f.risco);
                  return (
                    <tr key={f.nome} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                      <td className="px-3 py-2">{f.nome}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{f.severidade}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{f.probabilidade}</td>
                      <td className="px-3 py-2 text-center tabular-nums font-semibold">{f.risco}</td>
                      <td className="px-3 py-2"><Badge className={cn(cls.bg, cls.text, 'border')}>{cls.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
