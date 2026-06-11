import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CheckCircle2, Shield, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DIMENSAO_EXT_LABEL, ESCALA,
  questoesPorTipo, calcularScores,
} from '@/lib/climaExternoQuestoes';

const TIPOS = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'parceiro', label: 'Parceiro de negócios' },
  { value: 'candidato', label: 'Candidato em processo seletivo' },
  { value: 'ex_colaborador', label: 'Ex-colaborador' },
  { value: 'outro', label: 'Outro' },
];

const TEMPO = ['Menos de 6 meses', '6 meses a 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos'];

function fingerprint() {
  const k = 'cs_ext_fp';
  let f = localStorage.getItem(k);
  if (!f) {
    f = crypto.randomUUID();
    localStorage.setItem(k, f);
  }
  return f;
}

export default function ClimaExternoPublico() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState<any>(null);
  const [step, setStep] = useState<'perfil' | 'questoes' | 'comentarios' | 'enviado'>('perfil');
  const [submitting, setSubmitting] = useState(false);

  const [tipo, setTipo] = useState('');
  const [setor, setSetor] = useState('');
  const [tempoRel, setTempoRel] = useState('');
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [nps, setNps] = useState<number | null>(null);
  const [fortes, setFortes] = useState('');
  const [melhoria, setMelhoria] = useState('');

  useEffect(() => {
    (async () => {
      if (!token) { setLoading(false); return; }
      const { data, error } = await (supabase as any).rpc('get_clima_externo_publico', { p_token: token });
      if (!error && data?.[0]) setPesquisa(data[0]);
      setLoading(false);
    })();
  }, [token]);

  const questoes = useMemo(() => (tipo ? questoesPorTipo(tipo) : []), [tipo]);
  const todasRespondidas = questoes.every(q => typeof respostas[q.id] === 'number');

  const enviar = async () => {
    setSubmitting(true);
    try {
      const { scores, geral } = calcularScores(respostas, questoes);
      const { error } = await (supabase as any).rpc('submit_clima_externo_resposta', {
        p_token: token,
        p_tipo_stakeholder: tipo,
        p_setor: setor || null,
        p_tempo_relacionamento: tempoRel || null,
        p_scores_dimensao: scores,
        p_score_geral: geral,
        p_nps: nps,
        p_pontos_fortes: fortes || null,
        p_pontos_melhoria: melhoria || null,
        p_fingerprint: fingerprint(),
      });
      if (error) throw error;
      setStep('enviado');
    } catch (e: any) {
      toast({ title: 'Erro ao enviar', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!pesquisa) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Link inválido</CardTitle></CardHeader>
          <CardContent>Esta pesquisa não está disponível ou foi encerrada.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <header className="text-center">
          <h1 className="text-2xl font-bold">{pesquisa.nome}</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Respostas 100% anônimas — sua identidade não é registrada.
          </p>
        </header>

        {step === 'perfil' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Antes de começar</CardTitle>
              <CardDescription>Conte um pouco sobre seu relacionamento com a empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Sua relação com a empresa *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Setor / segmento (opcional)</Label>
                  <Input value={setor} onChange={e => setSetor(e.target.value)} placeholder="Ex.: Tecnologia" />
                </div>
                <div>
                  <Label>Tempo de relacionamento</Label>
                  <Select value={tempoRel} onValueChange={setTempoRel}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {TEMPO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button disabled={!tipo} onClick={() => setStep('questoes')} className="w-full">Continuar</Button>
            </CardContent>
          </Card>
        )}

        {step === 'questoes' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avaliação</CardTitle>
              <CardDescription>Marque o quanto você concorda com cada afirmação ({questoes.length} questões).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {Object.entries(
                questoes.reduce<Record<string, typeof questoes>>((acc, q) => {
                  (acc[q.dimensao] ??= []).push(q);
                  return acc;
                }, {})
              ).map(([dim, qs]) => (
                <div key={dim} className="space-y-3">
                  <h3 className="text-sm font-semibold text-[hsl(var(--nr1-primary))] border-b pb-1">
                    {DIMENSAO_EXT_LABEL[dim as keyof typeof DIMENSAO_EXT_LABEL]}
                  </h3>
                  {qs.map(q => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-sm">{q.texto}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ESCALA.map(e => (
                          <button
                            key={e.valor}
                            type="button"
                            onClick={() => setRespostas(r => ({ ...r, [q.id]: e.valor }))}
                            className={`text-xs px-2.5 py-1.5 rounded-md border transition ${
                              respostas[q.id] === e.valor
                                ? 'bg-[hsl(var(--nr1-primary))] text-white border-[hsl(var(--nr1-primary))]'
                                : 'bg-background hover:bg-muted'
                            }`}
                          >
                            {e.valor} · {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <Button disabled={!todasRespondidas} onClick={() => setStep('comentarios')} className="w-full">
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'comentarios' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Última etapa</CardTitle>
              <CardDescription>Suas observações ajudam a empresa a evoluir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Em uma escala de 0 a 10, quanto você recomendaria esta empresa?</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from({ length: 11 }, (_, i) => i).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNps(n)}
                      className={`w-9 h-9 text-sm rounded-md border ${
                        nps === n ? 'bg-[hsl(var(--nr1-primary))] text-white border-[hsl(var(--nr1-primary))]' : 'hover:bg-muted'
                      }`}
                    >{n}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Pontos fortes (opcional)</Label>
                <Textarea value={fortes} onChange={e => setFortes(e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Pontos a melhorar (opcional)</Label>
                <Textarea value={melhoria} onChange={e => setMelhoria(e.target.value)} rows={3} />
              </div>
              <Button disabled={submitting || nps === null} onClick={enviar} className="w-full">
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando…</> : 'Enviar avaliação'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'enviado' && (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
              <h2 className="text-xl font-bold">Obrigado pela sua avaliação!</h2>
              <p className="text-sm text-muted-foreground">
                Suas respostas foram registradas de forma anônima e contribuirão para a evolução da empresa.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
