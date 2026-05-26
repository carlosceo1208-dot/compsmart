import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CONSENT_VERSION = '2026.1';

export default function Nr1Consentimento() {
  const navigate = useNavigate();
  const [aceiteUso, setAceiteUso] = useState(false);
  const [aceiteAnonimato, setAceiteAnonimato] = useState(false);
  const [aceiteRevogacao, setAceiteRevogacao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const podeContinuar = aceiteUso && aceiteAnonimato && aceiteRevogacao;

  const handleAceitar = async () => {
    if (!podeContinuar) return;
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada');
      const { error } = await supabase
        .from('profiles')
        .update({
          nr1_consent_at: new Date().toISOString(),
          nr1_consent_version: CONSENT_VERSION,
        })
        .eq('id', user.id);
      if (error) throw error;
      toast({ title: 'Consentimento registrado', description: 'Obrigado. Você pode iniciar o questionário.' });
      navigate('/nr1/painel');
    } catch (e: any) {
      toast({ title: 'Erro ao registrar consentimento', description: e.message, variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const handleRecusar = () => {
    toast({
      title: 'Consentimento recusado',
      description: 'Você não participará deste ciclo. Sua recusa não tem impacto no seu vínculo ou avaliação.',
    });
    navigate('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center nr1-bg-gradient">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Termo de Consentimento — NR-1 Saúde Mental</CardTitle>
              <CardDescription>Versão {CONSENT_VERSION} · LGPD Art. 7º, II e Art. 11</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-semibold text-base">Por que pedimos seu consentimento</h3>
            <p>
              As respostas dos questionários NR-1 (Bem-Estar, Segurança Psicológica, COPSOQ-III) são
              consideradas <strong>dados pessoais sensíveis</strong> pela Lei Geral de Proteção de
              Dados — LGPD (Lei nº 13.709/2018, Art. 5º, II). Por isso pedimos sua autorização
              explícita antes de coletar qualquer resposta.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-base">O que coletamos e como usamos</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Suas respostas são armazenadas <strong>de forma anônima</strong>, identificadas por um hash criptográfico — sua empresa não consegue ligar uma resposta específica a você.</li>
              <li>Os resultados são exibidos sempre <strong>agregados</strong>, com piso mínimo de <strong>5 respondentes por grupo</strong> (k-anonimato). Grupos menores são automaticamente suprimidos.</li>
              <li>Dados clínicos individuais (caso existam) só são acessíveis ao profissional de Saúde Ocupacional, sob sigilo profissional.</li>
              <li>Os dados <strong>não são usados</strong> para avaliação de desempenho, decisões de promoção, demissão ou qualquer outra decisão individual sobre você.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-base">Seus direitos</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Você pode <strong>recusar</strong> participar a qualquer momento, sem qualquer impacto no seu vínculo ou avaliação.</li>
              <li>Você pode <strong>revogar</strong> seu consentimento futuramente em "Meu Perfil → Privacidade".</li>
              <li>Você pode solicitar <strong>exclusão</strong> ou <strong>portabilidade</strong> dos seus dados (LGPD Art. 18).</li>
            </ul>
          </section>

          <section className="space-y-3 border-t pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={aceiteUso} onCheckedChange={(v) => setAceiteUso(v === true)} className="mt-0.5" />
              <span className="text-sm">
                Li e <strong>autorizo</strong> a coleta e o uso das minhas respostas para fins de
                conformidade NR-1 e gestão de saúde mental coletiva.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={aceiteAnonimato} onCheckedChange={(v) => setAceiteAnonimato(v === true)} className="mt-0.5" />
              <span className="text-sm">
                Entendo que minhas respostas são <strong>anônimas</strong> e exibidas apenas em recortes agregados (mínimo 5 respondentes).
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={aceiteRevogacao} onCheckedChange={(v) => setAceiteRevogacao(v === true)} className="mt-0.5" />
              <span className="text-sm">
                Estou ciente de que posso <strong>revogar</strong> este consentimento a qualquer momento.
              </span>
            </label>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="flex-1 nr1-bg-gradient text-white"
              disabled={!podeContinuar || salvando}
              onClick={handleAceitar}
            >
              {salvando ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registrando…</> : 'Aceitar e continuar'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleRecusar} disabled={salvando}>
              Recusar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
