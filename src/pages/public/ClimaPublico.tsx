import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ShieldCheck, AlertTriangle, ClipboardList } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { QUESTOES, ESCALA_OPCOES, DIMENSAO_LABEL, calcularScores, type ClimaDimensao } from '@/lib/climaQuestoes';

const DIMENSOES = Array.from(new Set(QUESTOES.map((q) => q.dimensao))) as ClimaDimensao[];

// Hash anônimo a partir de fingerprint do navegador + token da pesquisa.
// Suficiente para evitar duplicatas no mesmo dispositivo sem identificar a pessoa.
async function buildAnonHash(token: string): Promise<string> {
  const fp = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset().toString(),
    token,
  ].join('|');
  const data = new TextEncoder().encode(fp);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ClimaPublico() {
  const { token } = useParams<{ token: string }>();
  const [pesquisa, setPesquisa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<'intro' | 'demo' | 'questionario' | 'fim'>('intro');
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [demo, setDemo] = useState({
    tipo_respondente: 'colaborador',
    departamento: '',
    funcao_nivel: '',
    tempo_empresa: '',
    modalidade_trabalho: '',
  });

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error } = await (supabase as any).rpc('get_clima_pesquisa_publica', { _token: token });
      if (error || !data || data.length === 0) {
        setNotFound(true);
      } else {
        setPesquisa(data[0]);
      }
      setLoading(false);
    })();
  }, [token]);

  const answered = Object.keys(respostas).length;
  const total = QUESTOES.length;
  const progresso = (answered / total) * 100;

  // Embaralhar perguntas (Fisher–Yates) para evitar indução por dimensão; estável durante a sessão
  const questoesEmbaralhadas = useMemo(() => {
    const arr = [...QUESTOES];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const enviar = async () => {
    if (!token || !pesquisa) return;
    setSubmitting(true);
    try {
      const hash = await buildAnonHash(token);
      const { geral, porDimensao } = calcularScores(respostas);
      const itens = QUESTOES.map((q) => ({
        dimensao: q.dimensao,
        questao_num: q.num,
        valor: respostas[`${q.dimensao}_${q.num}`],
      }));
      const { error } = await (supabase as any).rpc('submit_clima_resposta_anonima', {
        _token: token,
        _respondent_hash: hash,
        _tipo_respondente: demo.tipo_respondente,
        _departamento: demo.departamento,
        _funcao_nivel: demo.funcao_nivel,
        _tempo_empresa: demo.tempo_empresa,
        _modalidade_trabalho: demo.modalidade_trabalho,
        _score_geral: Number(geral.toFixed(2)),
        _scores_dimensao: porDimensao,
        _itens: itens,
      });
      if (error) {
        if (error.message?.includes('duplicate key')) {
          throw new Error('Você já respondeu esta pesquisa neste dispositivo.');
        }
        throw error;
      }
      setStep('fim');
    } catch (e: any) {
      toast({ title: 'Erro ao enviar', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12 space-y-3">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
            <h2 className="text-lg font-semibold">Pesquisa indisponível</h2>
            <p className="text-sm text-muted-foreground">
              Este link expirou ou a pesquisa foi encerrada. Entre em contato com o RH da sua empresa.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'fim') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[hsl(11_77%_60%/0.08)] to-background">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12 space-y-3">
            <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-500" />
            <h2 className="text-xl font-semibold">Resposta enviada com sucesso</h2>
            <p className="text-sm text-muted-foreground">
              Obrigado pela sua contribuição. Sua percepção ajudará a tornar o ambiente de trabalho melhor.
            </p>
            <p className="text-xs text-muted-foreground italic">100% anônima · LGPD · NR-1</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(11_77%_60%/0.06)] via-background to-background py-6 px-3">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header sempre visível */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(11_77%_60%/0.12)] text-[hsl(11_77%_45%)] text-xs font-semibold mb-2">
            <ClipboardList className="h-3 w-3" /> Pesquisa de Clima 360°
          </div>
          <h1 className="text-2xl font-bold">{pesquisa.nome}</h1>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <ShieldCheck className="h-3 w-3" /> Resposta <strong>100% anônima</strong> · armazenada via hash criptográfico
          </p>
        </div>

        {step === 'intro' && (
          <Card>
            <CardContent className="py-8 space-y-4">
              <p className="text-sm">Esta pesquisa avalia o clima organizacional em 10 dimensões fundamentais:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {DIMENSOES.map((d) => (
                  <div key={d} className="px-3 py-2 rounded-md bg-muted">{DIMENSAO_LABEL[d]}</div>
                ))}
              </div>
              <div className="bg-[hsl(var(--nr1-primary)/0.06)] border border-[hsl(var(--nr1-primary)/0.2)] rounded-md p-3 text-sm">
                <p className="font-semibold mb-1">Como funciona:</p>
                <ul className="text-xs space-y-0.5 list-disc list-inside text-muted-foreground">
                  <li>60 questões em escala de 1 a 5 (Discordo totalmente → Concordo totalmente)</li>
                  <li>Cerca de <strong>15 minutos</strong> para responder</li>
                  <li>Suas respostas vão para análises agregadas — ninguém vê respostas individuais</li>
                  <li>Você pode responder de qualquer dispositivo (apenas uma vez por dispositivo)</li>
                </ul>
              </div>
              <Button className="w-full bg-[hsl(11_77%_60%)] hover:bg-[hsl(11_77%_55%)] text-white" onClick={() => setStep('demo')}>
                Começar
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'demo' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados de segmentação</CardTitle>
              <CardDescription className="text-xs">
                Usados apenas para análise agregada por grupo (não identificam você).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={demo.tipo_respondente} onValueChange={(v) => setDemo({ ...demo, tipo_respondente: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colaborador">Colaborador</SelectItem>
                      <SelectItem value="lideranca">Liderança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Departamento</Label>
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
                <div className="sm:col-span-2">
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
                Continuar para as 60 questões
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'questionario' && (
          <>
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 -mx-3 px-3 border-b">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-semibold">{answered} de {total} respondidas</span>
                <span className="text-muted-foreground">{Math.round(progresso)}%</span>
              </div>
              <Progress value={progresso} />
            </div>

            {questoesEmbaralhadas.map((q, idx) => {
              const key = `${q.dimensao}_${q.num}`;
              return (
                <Card key={key}>
                  <CardContent className="space-y-3 py-4">
                    <p className="text-xs font-semibold text-muted-foreground">Pergunta {idx + 1} de {total}</p>
                    <p className="text-sm font-medium">{q.texto}</p>
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
                                ? 'bg-[hsl(11_77%_60%)] text-white border-[hsl(11_77%_60%)]'
                                : 'border-border hover:border-[hsl(11_77%_60%)]'
                            }`}
                          >
                            {o.value} · {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="sticky bottom-2 border-[hsl(11_77%_60%/0.4)]">
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="text-sm">
                  <p className="font-semibold">{answered} / {total} respondidas</p>
                  {answered < total && <p className="text-xs text-muted-foreground">Responda todas para enviar.</p>}
                </div>
                <Button
                  className="bg-[hsl(11_77%_60%)] hover:bg-[hsl(11_77%_55%)] text-white"
                  onClick={enviar}
                  disabled={answered < total || submitting}
                >
                  {submitting ? 'Enviando…' : 'Enviar respostas'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
