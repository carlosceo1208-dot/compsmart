import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { respondentHash } from '@/lib/nr1';
import { QUESTOES, ESCALA_OPCOES, DIMENSAO_LABEL, calcularScores, type ClimaDimensao } from '@/lib/climaQuestoes';

const DIMENSOES = Array.from(new Set(QUESTOES.map((q) => q.dimensao))) as ClimaDimensao[];

export default function Nr1ClimaResponder() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [demo, setDemo] = useState({
    tipo_respondente: 'colaborador',
    departamento: '',
    funcao_nivel: '',
    tempo_empresa: '',
    modalidade_trabalho: '',
  });
  const [step, setStep] = useState<'demo' | 'questionario' | 'fim'>('demo');
  const [submitting, setSubmitting] = useState(false);

  const { data: pesquisa } = useQuery({
    queryKey: ['clima-pesquisa', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('clima_pesquisas').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const answered = Object.keys(respostas).length;
  const total = QUESTOES.length;
  const progresso = (answered / total) * 100;

  const enviar = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para responder.');
      const hash = await respondentHash(user.id, id);
      const { geral, porDimensao } = calcularScores(respostas);

      // Inserir resposta principal
      const { data: resp, error: errResp } = await (supabase as any)
        .from('clima_respostas')
        .insert({
          pesquisa_id: id,
          company_id: pesquisa?.company_id,
          respondent_hash: hash,
          ...demo,
          score_geral: Number(geral.toFixed(2)),
          scores_dimensao: porDimensao,
        })
        .select()
        .single();
      if (errResp) throw errResp;

      // Inserir itens
      const itens = QUESTOES.map((q) => ({
        resposta_id: resp.id,
        dimensao: q.dimensao,
        questao_num: q.num,
        valor: respostas[`${q.dimensao}_${q.num}`],
      }));
      const { error: errIt } = await (supabase as any).from('clima_respostas_itens').insert(itens);
      if (errIt) throw errIt;

      // Atualizar agregados da pesquisa (cálculo simples; pode virar trigger depois)
      const { data: todas } = await (supabase as any)
        .from('clima_respostas')
        .select('score_geral, scores_dimensao')
        .eq('pesquisa_id', id);
      const n = todas?.length ?? 1;
      const novoGeral = todas?.reduce((a: number, r: any) => a + Number(r.score_geral ?? 0), 0) / n;
      const novoDim: Record<string, number> = {};
      for (const dim of DIMENSOES) {
        novoDim[dim] = todas?.reduce((a: number, r: any) => a + Number(r.scores_dimensao?.[dim] ?? 0), 0) / n;
      }
      await (supabase as any)
        .from('clima_pesquisas')
        .update({ total_respondentes: n, score_geral: Number(novoGeral.toFixed(2)), scores_dimensao: novoDim })
        .eq('id', id);

      setStep('fim');
      toast({ title: 'Resposta registrada', description: 'Obrigado pela sua contribuição anônima.' });
    } catch (e: any) {
      toast({ title: 'Erro ao enviar', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'fim') {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="text-center py-12 space-y-3">
          <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-500" />
          <h2 className="text-xl font-semibold">Resposta enviada com sucesso</h2>
          <p className="text-sm text-muted-foreground">Sua percepção contribui para tornar o ambiente melhor.</p>
          <Button asChild><Link to="/nr1/clima">Voltar à pesquisa</Link></Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'demo') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <Button variant="ghost" size="sm" asChild className="self-start mb-2 w-fit">
            <Link to="/nr1/clima"><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Link>
          </Button>
          <CardTitle>{pesquisa?.nome ?? 'Pesquisa de clima'}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-xs">
            <ShieldCheck className="h-3 w-3" /> Suas respostas são <strong>anônimas</strong> — armazenadas via hash criptográfico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">Antes de começar, alguns dados para segmentação agregada (não identificam você):</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={demo.tipo_respondente} onValueChange={(v) => setDemo({ ...demo, tipo_respondente: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="lideranca">Liderança</SelectItem>
                  <SelectItem value="cliente_interno">Cliente interno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Departamento / Área</Label>
              <Select value={demo.departamento} onValueChange={(v) => setDemo({ ...demo, departamento: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {['Operações', 'Comercial', 'Tecnologia', 'Administrativo', 'RH', 'Financeiro', 'Outro'].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Função / Nível</Label>
              <Select value={demo.funcao_nivel} onValueChange={(v) => setDemo({ ...demo, funcao_nivel: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {['Operacional', 'Supervisão', 'Liderança', 'Executiva'].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tempo de empresa</Label>
              <Select value={demo.tempo_empresa} onValueChange={(v) => setDemo({ ...demo, tempo_empresa: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {['< 6 meses', '6-12 meses', '1-2 anos', '2-5 anos', '5+ anos'].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modalidade de trabalho</Label>
              <Select value={demo.modalidade_trabalho} onValueChange={(v) => setDemo({ ...demo, modalidade_trabalho: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {['Presencial', 'Remoto', 'Híbrido'].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={() => setStep('questionario')}>
            Começar questionário (60 questões · ~15 min)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-semibold">{answered} de {total} respondidas</span>
          <span className="text-muted-foreground">{Math.round(progresso)}%</span>
        </div>
        <Progress value={progresso} />
      </div>

      {DIMENSOES.map((dim) => {
        const itens = QUESTOES.filter((q) => q.dimensao === dim);
        return (
          <Card key={dim}>
            <CardHeader>
              <CardTitle className="text-base">{DIMENSAO_LABEL[dim]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {itens.map((q) => {
                const key = `${q.dimensao}_${q.num}`;
                return (
                  <div key={key} className="space-y-1.5">
                    <p className="text-sm font-medium">{q.num}. {q.texto}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ESCALA_OPCOES.map((o) => {
                        const selected = respostas[key] === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => setRespostas({ ...respostas, [key]: o.value })}
                            className={`px-2.5 py-1.5 rounded-md border text-xs transition-all ${
                              selected
                                ? 'bg-[hsl(var(--nr1-primary))] text-white border-[hsl(var(--nr1-primary))]'
                                : 'border-border hover:border-[hsl(var(--nr1-primary))]'
                            }`}
                          >
                            {o.value} · {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <Card className="sticky bottom-2 border-[hsl(var(--nr1-primary)/0.3)]">
        <CardContent className="flex items-center justify-between gap-3 py-3">
          <div className="text-sm">
            <p className="font-semibold">{answered} / {total} respondidas</p>
            {answered < total && <p className="text-xs text-muted-foreground">Responda todas para enviar.</p>}
          </div>
          <Button onClick={enviar} disabled={answered < total || submitting}>
            {submitting ? 'Enviando…' : 'Enviar respostas'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
