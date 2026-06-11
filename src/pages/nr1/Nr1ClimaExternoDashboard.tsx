import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowLeft, Users, Star, TrendingUp, MessageSquareQuote, Copy } from 'lucide-react';
import { DIMENSAO_EXT_LABEL, type ClimaExternoDimensao } from '@/lib/climaExternoQuestoes';
import { toast } from '@/hooks/use-toast';

const TIPO_LABEL: Record<string, string> = {
  cliente: 'Cliente', fornecedor: 'Fornecedor', parceiro: 'Parceiro',
  candidato: 'Candidato', ex_colaborador: 'Ex-colaborador', outro: 'Outro',
};

export default function Nr1ClimaExternoDashboard() {
  const { activeCompanyId } = useCompanyContext();
  const { id } = useParams<{ id?: string }>();
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const { data: pesquisas = [] } = useQuery({
    queryKey: ['clima-ext-pesquisas', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('clima_pesquisas')
        .select('id, nome, public_token, modalidade')
        .eq('company_id', activeCompanyId)
        .eq('modalidade', 'com_clientes_externos')
        .order('created_at', { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const pesquisaSelecionada = useMemo(
    () => pesquisas.find(p => p.id === id) ?? pesquisas[0],
    [pesquisas, id]
  );

  const { data: respostas = [] } = useQuery({
    queryKey: ['clima-ext-respostas', pesquisaSelecionada?.id],
    enabled: !!pesquisaSelecionada?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('clima_externo_respostas')
        .select('*')
        .eq('pesquisa_id', pesquisaSelecionada.id)
        .order('created_at', { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const filtradas = filtroTipo === 'todos' ? respostas : respostas.filter(r => r.tipo_stakeholder === filtroTipo);

  const stats = useMemo(() => {
    if (!filtradas.length) return null;
    const scoreGeral = filtradas.reduce((s, r) => s + (Number(r.score_geral) || 0), 0) / filtradas.length;

    // eNPS externo
    const npsVals = filtradas.map(r => r.nps).filter((n): n is number => typeof n === 'number');
    const promotores = npsVals.filter(n => n >= 9).length;
    const detratores = npsVals.filter(n => n <= 6).length;
    const nps = npsVals.length ? Math.round(((promotores - detratores) / npsVals.length) * 100) : null;

    // scores por dimensão (média)
    const dimAgg: Record<string, { soma: number; n: number }> = {};
    for (const r of filtradas) {
      const sd = (r.scores_dimensao || {}) as Record<string, number>;
      for (const [d, v] of Object.entries(sd)) {
        dimAgg[d] ??= { soma: 0, n: 0 };
        dimAgg[d].soma += v; dimAgg[d].n += 1;
      }
    }
    const dims = Object.entries(dimAgg).map(([d, { soma, n }]) => ({
      dim: d as ClimaExternoDimensao,
      score: Number((soma / n).toFixed(2)),
    })).sort((a, b) => b.score - a.score);

    // por tipo
    const porTipo: Record<string, number> = {};
    for (const r of filtradas) porTipo[r.tipo_stakeholder] = (porTipo[r.tipo_stakeholder] || 0) + 1;

    return { scoreGeral: Number(scoreGeral.toFixed(2)), nps, dims, porTipo };
  }, [filtradas]);

  const copiarLink = async () => {
    if (!pesquisaSelecionada) return;
    const link = `${window.location.origin}/clima-externo/${pesquisaSelecionada.public_token}`;
    await navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado', description: 'Compartilhe com clientes, fornecedores e candidatos.' });
  };

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link to="/nr1/clima"><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Link></Button>
        <div>
          <h1 className="text-xl font-bold">Clima Externo — Stakeholders 360°</h1>
          <p className="text-sm text-muted-foreground">Percepção de clientes, fornecedores, parceiros, candidatos e ex-colaboradores.</p>
        </div>
      </div>

      {!pesquisas.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma pesquisa de clima externo criada ainda. Na tela de Clima, escolha a modalidade
            <strong> “Clima + Clientes externos”</strong> ao criar uma pesquisa.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="py-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">{pesquisaSelecionada.nome}</span>
              <Badge variant="outline">{filtradas.length} resposta(s)</Badge>
              <div className="ml-auto flex gap-2">
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {Object.entries(TIPO_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={copiarLink}><Copy className="h-3.5 w-3.5 mr-1.5" />Copiar link público</Button>
              </div>
            </CardContent>
          </Card>

          {!stats ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Aguardando respostas externas.</CardContent></Card>
          ) : (
            <>
              <div className="grid sm:grid-cols-3 gap-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3.5 w-3.5" />Score Geral</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold">{stats.scoreGeral}<span className="text-sm text-muted-foreground"> /5</span></p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />NPS Externo</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.nps ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.nps === null ? 'Sem dados' : stats.nps >= 50 ? 'Zona excelente' : stats.nps >= 0 ? 'Zona aceitável' : 'Zona crítica'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" />Respondentes por tipo</CardTitle></CardHeader>
                  <CardContent className="text-xs space-y-0.5">
                    {Object.entries(stats.porTipo).map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span>{TIPO_LABEL[k] || k}</span><strong>{v}</strong></div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Scores por dimensão</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {stats.dims.map(({ dim, score }) => (
                    <div key={dim} className="flex items-center gap-2 text-sm">
                      <div className="w-64 truncate">{DIMENSAO_EXT_LABEL[dim] ?? dim}</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full"
                          style={{
                            width: `${(score / 5) * 100}%`,
                            background: score >= 4 ? 'hsl(160 70% 45%)' : score >= 3 ? 'hsl(38 90% 55%)' : 'hsl(0 70% 55%)',
                          }} />
                      </div>
                      <div className="w-12 text-right font-mono text-sm">{score.toFixed(2)}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquareQuote className="h-4 w-4" />Comentários abertos</CardTitle></CardHeader>
                <CardContent className="space-y-3 max-h-[420px] overflow-y-auto">
                  {filtradas.filter(r => r.comentario_pontos_fortes || r.comentario_pontos_melhoria).map(r => (
                    <div key={r.id} className="border rounded-md p-3 text-sm space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{TIPO_LABEL[r.tipo_stakeholder] || r.tipo_stakeholder}</Badge>
                        {r.setor && <span>· {r.setor}</span>}
                        {r.tempo_relacionamento && <span>· {r.tempo_relacionamento}</span>}
                        {typeof r.nps === 'number' && <span className="ml-auto">NPS: <strong>{r.nps}</strong></span>}
                      </div>
                      {r.comentario_pontos_fortes && (
                        <p><strong className="text-emerald-600">+ </strong>{r.comentario_pontos_fortes}</p>
                      )}
                      {r.comentario_pontos_melhoria && (
                        <p><strong className="text-amber-600">! </strong>{r.comentario_pontos_melhoria}</p>
                      )}
                    </div>
                  ))}
                  {!filtradas.some(r => r.comentario_pontos_fortes || r.comentario_pontos_melhoria) && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum comentário aberto enviado.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
