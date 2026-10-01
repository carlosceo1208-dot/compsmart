import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Loader2, PauseCircle, XCircle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Nr1CheckupConjunto } from '@/components/nr1/Nr1CheckupConjunto';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

type Jornada = {
  id: string; status: string; semana_atual: number; momento_atual: number;
  started_at: string; consent_id_at: string | null;
};
type Checkin = { semana: number; humor_1_10: number; criado_em: string; comentario: string | null; acoes_executadas: any };

const ACOES_PADRAO = [
  'Pratiquei pelo menos 1 pausa consciente por dia',
  'Conversei com alguém sobre como me sinto',
  'Fiz algum movimento físico (caminhada, alongamento)',
  'Dormi pelo menos 7h em 4 dias da semana',
  'Estabeleci 1 limite saudável (dizer não, sair no horário)',
];

export default function Nr1Acompanhamento() {
  const navigate = useNavigate();
  const { data: roleInfo } = useCurrentUserRole();
  const verConjunto = !!(roleInfo?.isHR || roleInfo?.isAdmin || roleInfo?.isSuperAdmin);
  const [loading, setLoading] = useState(true);
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [humor, setHumor] = useState<number[]>([7]);
  const [acoes, setAcoes] = useState<Record<string, boolean>>({});
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);

  const semanaCorrente = jornada?.semana_atual ?? 1;
  const jaRespondeu = checkins.some((c) => c.semana === semanaCorrente);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { toast.error('Faça login.'); return; }

      const { data: j } = await supabase
        .from('nr1_jornadas')
        .select('id, status, semana_atual, momento_atual, started_at, consent_id_at')
        .eq('user_id', userData.user.id)
        .in('status', ['ativa', 'pausada'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!j) {
        setJornada(null);
        setLoading(false);
        return;
      }
      setJornada(j);

      const { data: cs } = await supabase
        .from('nr1_checkins_semanais')
        .select('semana, humor_1_10, criado_em, comentario, acoes_executadas')
        .eq('jornada_id', j.id)
        .order('semana', { ascending: true });
      setCheckins((cs ?? []) as Checkin[]);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar acompanhamento.');
    } finally {
      setLoading(false);
    }
  }

  async function salvarCheckin() {
    if (!jornada) return;
    setSaving(true);
    try {
      const acoesArr = Object.entries(acoes).filter(([_, v]) => v).map(([k]) => k);
      const { error } = await supabase.from('nr1_checkins_semanais').insert({
        jornada_id: jornada.id,
        semana: semanaCorrente,
        humor_1_10: humor[0],
        acoes_executadas: acoesArr,
        comentario: comentario || null,
      });
      if (error) throw error;

      // Avança a semana se ainda não chegou ao fim
      if (semanaCorrente < 12) {
        await supabase.from('nr1_jornadas').update({ semana_atual: semanaCorrente + 1 }).eq('id', jornada.id);
      } else {
        await supabase.from('nr1_jornadas').update({ status: 'concluida', concluded_at: new Date().toISOString() }).eq('id', jornada.id);
        toast.success('Parabéns! Você concluiu sua jornada de 12 semanas. 💚');
      }
      toast.success('Check-in registrado.');
      setComentario('');
      setAcoes({});
      setHumor([7]);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message?.includes('duplicate') ? 'Você já fez o check-in dessa semana.' : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function pausar() {
    if (!jornada) return;
    await supabase.from('nr1_jornadas').update({ status: 'pausada' }).eq('id', jornada.id);
    toast.success('Jornada pausada.');
    load();
  }

  async function encerrar() {
    if (!jornada) return;
    if (!confirm('Tem certeza que quer encerrar agora? Você pode iniciar uma nova jornada depois.')) return;
    await supabase.from('nr1_jornadas')
      .update({ status: 'encerrada_pelo_usuario', concluded_at: new Date().toISOString(), encerramento_motivo: 'Encerrada pelo colaborador (LGPD Art. 18)' })
      .eq('id', jornada.id);
    toast.success('Jornada encerrada. Seus dados estão preservados conforme a LGPD.');
    load();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-[50vh]"><Loader2 className="h-6 w-6 animate-spin nr1-text-primary" /></div>;
  }

  if (!jornada) {
    return (
      <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Acompanhamento Semanal</CardTitle>
          <CardDescription>Você ainda não tem uma jornada ativa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/nr1/jornada')} className="nr1-bg-primary text-white">
            <Heart className="h-4 w-4 mr-2" /> Iniciar minha jornada
          </Button>
        </CardContent>
      </Card>
      {verConjunto && <Nr1CheckupConjunto />}
      </div>
    );
  }

  const progresso = Math.min(100, Math.round((checkins.length / 12) * 100));
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const c = checkins.find((x) => x.semana === i + 1);
    return { semana: `S${i + 1}`, humor: c ? c.humor_1_10 : null };
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 nr1-text-primary" /> Acompanhamento Semanal
              <Badge variant={jornada.status === 'ativa' ? 'default' : 'secondary'}>{jornada.status}</Badge>
            </CardTitle>
            <CardDescription>
              Semana {semanaCorrente} de 12 — {checkins.length} check-in(s) realizado(s).
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/nr1/jornada')}>
              <MessageCircle className="h-4 w-4 mr-1" /> Conversar com o agente
            </Button>
            <Button variant="ghost" size="sm" onClick={pausar} disabled={jornada.status === 'pausada'}>
              <PauseCircle className="h-4 w-4 mr-1" /> Pausar
            </Button>
            <Button variant="ghost" size="sm" onClick={encerrar} className="text-destructive">
              <XCircle className="h-4 w-4 mr-1" /> Encerrar (LGPD Art. 18)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progresso} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Check-in da semana */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Check-in da semana {semanaCorrente}</CardTitle>
            <CardDescription>Leva 1 minutinho. Só você vê suas respostas; o RH vê apenas médias de grupos com 5 pessoas ou mais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {jaRespondeu ? (
              <p className="text-sm text-muted-foreground">
                ✅ Você já fez o check-in dessa semana. Volte na próxima.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Como você se sentiu essa semana?</label>
                  <Slider value={humor} onValueChange={setHumor} min={1} max={10} step={1} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 — muito difícil</span>
                    <span className="font-bold text-base nr1-text-primary">{humor[0]}</span>
                    <span>10 — muito boa</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quais ações você praticou?</label>
                  <div className="space-y-1.5">
                    {ACOES_PADRAO.map((a) => (
                      <label key={a} className="flex items-start gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={!!acoes[a]}
                          onCheckedChange={(v) => setAcoes((p) => ({ ...p, [a]: !!v }))}
                        />
                        <span>{a}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Algo que queira compartilhar? <span className="text-muted-foreground">(opcional)</span></label>
                  <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} placeholder="Escreva livremente…" />
                </div>

                <Button onClick={salvarCheckin} disabled={saving} className="w-full nr1-bg-primary text-white">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Registrar check-in
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de evolução */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução do humor</CardTitle>
            <CardDescription>Sua linha das 12 semanas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" fontSize={11} />
                  <YAxis domain={[1, 10]} fontSize={11} />
                  <Tooltip />
                  <ReferenceLine y={5} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="humor" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      {verConjunto && <Nr1CheckupConjunto />}
    </div>
  );
}
