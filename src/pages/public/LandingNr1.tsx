import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Calculator, ArrowRight, Clock, Lock, FileCheck, Award } from 'lucide-react';
import Nr1HeroBento from '@/components/landing/nr1/Nr1HeroBento';
import { Footer } from '@/components/landing/Footer';
import { SecuritySection } from '@/components/landing/SecuritySection';
import Nr1PerguntasChro from '@/components/landing/nr1/Nr1PerguntasChro';
import Nr1TabelaCategoria from '@/components/landing/nr1/Nr1TabelaCategoria';
import Nr1ComoFunciona from '@/components/landing/nr1/Nr1ComoFunciona';
import Nr1ProvaCorrelacao from '@/components/landing/nr1/Nr1ProvaCorrelacao';
import Nr1Faq, { NR1_FAQ_JSONLD } from '@/components/landing/nr1/Nr1Faq';
import Nr1GestaoTerceiros from '@/components/landing/nr1/Nr1GestaoTerceiros';
import Nr1Header from '@/components/landing/nr1/Nr1Header';
import Nr1PricingCards from '@/components/landing/nr1/Nr1PricingCards';
import Nr1DiscountSimulator from '@/components/landing/nr1/Nr1DiscountSimulator';
import Nr1Novidades from '@/components/landing/nr1/Nr1Novidades';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useNr1Questoes } from '@/hooks/useNr1';

import { calcRisco, RISCO_CLASS, RISCO_LABEL, RESPOSTA_OPCOES, estimarMultaAnual } from '@/lib/nr1';
import { toast } from '@/hooks/use-toast';

const leadSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  empresa: z.string().trim().min(2).max(200),
  telefone: z.string().trim().max(40).optional().or(z.literal('')),
  cargo: z.string().trim().max(120).optional().or(z.literal('')),
  tamanho_empresa: z.string().trim().max(40).optional().or(z.literal('')),
});

type Step = 'landing' | 'questionario' | 'lead' | 'resultado';

const formatBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function LandingNr1() {
  const [step, setStep] = useState<Step>('landing');
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [numColab, setNumColab] = useState(50);
  const [form, setForm] = useState({ nome: '', email: '', empresa: '', telefone: '', cargo: '', tamanho_empresa: '' });
  const [scoreFree, setScoreFree] = useState<number | null>(null);
  const navigate = useNavigate();
  // auth CTA handled by Nr1Header

  const { data: questoes } = useNr1Questoes(true);
  const total = questoes?.length ?? 0;
  const questao = questoes?.[currentIdx];
  const progress = total > 0 ? ((currentIdx + 1) / total) * 100 : 0;

  const multa = estimarMultaAnual(numColab);

  const responder = (valor: number) => {
    if (!questao) return;
    setRespostas((r) => ({ ...r, [questao.id]: valor }));
    if (currentIdx + 1 < total) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // calcula score (média * 25, considerando reverso)
      let soma = 0;
      questoes!.forEach((q) => {
        const v = q.id === questao.id ? valor : respostas[q.id] ?? 0;
        soma += (q.reverso ? 4 - v : v);
      });
      const media = soma / questoes!.length;
      setScoreFree(Math.round(media * 25 * 10) / 10);
      setStep('lead');
    }
  };

  const enviarLead = async () => {
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: 'Verifique os campos', description: 'Nome, email e empresa são obrigatórios.', variant: 'destructive' });
      return;
    }
    const nivel = calcRisco(scoreFree);
    const { error } = await supabase.from('nr1_leads').insert({
      nome: parsed.data.nome,
      email: parsed.data.email,
      empresa: parsed.data.empresa,
      telefone: parsed.data.telefone || null,
      cargo: parsed.data.cargo || null,
      tamanho_empresa: parsed.data.tamanho_empresa || null,
      score_free: scoreFree,
      nivel_risco_free: nivel,
      respostas_free: respostas,
      origem: 'landing_nr1',
    });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    setStep('resultado');
  };

  useEffect(() => {
    document.title = 'NR-1 Inteligente — Cruze risco psicossocial com 9Box e remuneração | CompSmart';
    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const desc = 'A 1ª plataforma do Brasil a cruzar NR-1 com 9Box e remuneração. Conformidade legal + inteligência de talentos em um só lugar. Diagnóstico grátis em 2 min.';
    setMeta('description', desc);
    setMeta('og:title', 'NR-1 Inteligente | CompSmart', 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', 'website', 'property');

    // JSON-LD FAQ
    const ldId = 'nr1-faq-jsonld';
    let ld = document.getElementById(ldId) as HTMLScriptElement | null;
    if (!ld) { ld = document.createElement('script'); ld.id = ldId; ld.type = 'application/ld+json'; document.head.appendChild(ld); }
    ld.textContent = JSON.stringify(NR1_FAQ_JSONLD);
    return () => { document.getElementById(ldId)?.remove(); };
  }, []);

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="nr1-scope min-h-screen bg-background">

      {/* Header */}
      <Nr1Header onAnchor={scrollToId} />

      {step === 'landing' && (
        <>
          {/* HERO — categoria nova */}
          <Nr1Hero
            onDiagnostico={() => setStep('questionario')}
            onComoFunciona={() => scrollToId('como-funciona')}
          />

          {/* Faixa de urgência inteligente */}
          <section className="bg-foreground text-background">
            <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-center gap-3 text-center md:text-left">
              <Clock className="h-5 w-5 nr1-text-accent flex-shrink-0" />
              <p className="text-sm md:text-base">
                <strong>Fiscalização: maio/2026.</strong>{' '}
                <span className="opacity-80">
                  Mas os dados que você perde se não integrar agora — não voltam.
                </span>
              </p>
            </div>
          </section>

          {/* 3 perguntas que só a CompSmart responde */}
          <div id="funcionalidades">
            <Nr1PerguntasChro />
          </div>

          {/* Tabela NR-1 Tradicional vs. Inteligente */}
          <Nr1TabelaCategoria />

          {/* Como funciona — 5 passos */}
          <Nr1ComoFunciona idAnchor="como-funciona" />

          {/* Calculadora de multa — reposicionada como "piso" */}
          <section className="container mx-auto px-4 py-10">
            <Card className="max-w-2xl mx-auto nr1-bg-soft border-[hsl(var(--nr1-primary)/0.3)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 nr1-text-primary" /> Piso de risco: exposição a multas
                </CardTitle>
                <CardDescription>
                  Multa é o <em>piso</em> do problema. O custo real é perder talento — calcule o piso primeiro.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="colab">Quantos colaboradores sua empresa tem?</Label>
                  <Input
                    id="colab"
                    type="number"
                    min={1}
                    max={1000}
                    value={numColab}
                    onChange={(e) => setNumColab(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Stat label="Mínimo" value={formatBRL(multa.min)} tone="ok" />
                  <Stat label="Cenário provável" value={formatBRL(multa.cenarioProvavel)} tone="warn" />
                  <Stat label="Máximo" value={formatBRL(multa.max)} tone="bad" />
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  💡 A CompSmart elimina essa exposição <strong>e</strong> ainda te entrega
                  inteligência de retenção.{' '}
                  <button onClick={() => scrollToId('fale-conosco')} className="underline nr1-text-primary font-semibold">
                    Solicite uma proposta
                  </button>.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Diagnóstico express CTA — conversor principal */}
          <section className="container mx-auto px-4 py-10">
            <div className="max-w-3xl mx-auto rounded-2xl p-8 md:p-10 text-center nr1-bg-gradient text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Faça o diagnóstico NR-1 da sua empresa agora
              </h2>
              <p className="opacity-90 mb-6 max-w-xl mx-auto">
                10 perguntas · 2 minutos · score psicossocial estimado + nível de risco.
              </p>
              <Button
                size="lg"
                className="bg-white text-foreground hover:bg-white/90"
                onClick={() => setStep('questionario')}
              >
                Iniciar diagnóstico grátis <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </section>

          {/* Prova social de correlação */}
          <Nr1ProvaCorrelacao />

          {/* PLANOS — pricing por faixa de colaboradores */}
          <Nr1PricingCards onContratar={() => scrollToId('fale-conosco')} />

          {/* Simulador de desconto (mesmos descontos do módulo Remuneração) */}
          <section className="container mx-auto px-4 pb-14">
            <Nr1DiscountSimulator onCTA={() => scrollToId('fale-conosco')} />
          </section>

          {/* NOVIDADES NR-1 */}
          <Nr1Novidades />

          {/* Conformidade técnica */}
          <section className="container mx-auto px-4 py-10">
            <div className="max-w-4xl mx-auto">
              <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Conformidade técnica garantida
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: FileCheck, label: 'COPSOQ-III', sub: '6 dimensões · 40 questões' },
                  { icon: ShieldCheck, label: 'Portaria MTE', sub: '1.419/2024 · Anexo III' },
                  { icon: Award, label: 'PGR integrado', sub: 'Plano de ação compliant' },
                  { icon: Lock, label: 'LGPD', sub: 'Respostas 100% anônimas' },
                ].map((c, i) => (
                  <div key={i} className="border rounded-lg p-4 text-center bg-card">
                    <c.icon className="h-5 w-5 mx-auto nr1-text-primary mb-2" />
                    <p className="text-sm font-semibold">{c.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Gestão de Terceiros & PGR — novo diferencial */}
          <Nr1GestaoTerceiros />

          {/* Segurança Enterprise — confiança/objeções */}
          <SecuritySection />



          {/* Fale com um especialista — proposta sob medida */}
          <section id="fale-conosco" className="container mx-auto px-4 py-14">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Solicite uma proposta personalizada</h2>
                <p className="text-muted-foreground">
                  Cada empresa tem um contexto. Conte para a gente o seu — e montamos um pacote
                  sob medida (NR-1 + 9Box + remuneração) com o melhor custo-benefício para o seu porte.
                </p>
              </div>
              <Card className="border-2 border-[hsl(var(--nr1-primary)/0.3)]">
                <CardContent className="pt-6">
                  <ProposalForm />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* FAQ */}
          <div id="faq">
            <Nr1Faq />
          </div>

          {/* CTA final */}
          <section className="container mx-auto px-4 pb-16">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">
                Comece pelo diagnóstico. Decida com dados.
              </h2>
              <p className="text-muted-foreground">
                Resultado em 2 minutos · 100% LGPD-compliant · Proposta sob medida.
              </p>
              <Button size="lg" className="nr1-btn-primary text-white" onClick={() => setStep('questionario')}>
                Diagnóstico grátis NR-1 <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </section>
        </>
      )}

      {step === 'questionario' && questao && (
        <section className="container mx-auto px-4 py-10 max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Pergunta {currentIdx + 1} de {total}</span>
                <span>Diagnóstico Express NR-1</span>
              </div>
              <Progress value={progress} className="h-2" />
              <CardTitle className="text-lg mt-4 leading-snug">{questao.enunciado}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                key={questao.id}
                value={respostas[questao.id]?.toString()}
                onValueChange={(v) => responder(Number(v))}
                className="space-y-2"
              >
                {RESPOSTA_OPCOES.map((opt) => (
                  <Label key={opt.value} htmlFor={`fopt-${opt.value}`}
                    className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-accent transition-colors">
                    <RadioGroupItem value={opt.value.toString()} id={`fopt-${opt.value}`} />
                    <span className="text-sm">{opt.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </section>
      )}

      {step === 'lead' && (
        <section className="container mx-auto px-4 py-10 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Quase lá!</CardTitle>
              <CardDescription>
                Informe seus dados para visualizar seu score e receber sugestões personalizadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ['nome','Nome*'], ['email','Email corporativo*'], ['empresa','Empresa*'],
                ['cargo','Cargo'], ['telefone','Telefone'], ['tamanho_empresa','Tamanho (ex: 100-500)'],
              ].map(([k, lab]) => (
                <div key={k}>
                  <Label htmlFor={k}>{lab}</Label>
                  <Input id={k} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} maxLength={k === 'email' ? 255 : 200} />
                </div>
              ))}
              <Button onClick={enviarLead} className="w-full nr1-bg-primary mt-2">Ver meu resultado</Button>
              <p className="text-xs text-muted-foreground text-center">
                Seus dados são tratados conforme LGPD e usados apenas para enviar o diagnóstico.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {step === 'resultado' && scoreFree !== null && (
        <section className="container mx-auto px-4 py-10 max-w-xl">
          <Card>
            <CardHeader className="text-center">
              <ShieldCheck className="h-12 w-12 mx-auto nr1-text-primary mb-2" />
              <CardTitle>Seu diagnóstico express está pronto</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Score psicossocial estimado</p>
                <p className="text-5xl font-bold">{scoreFree.toFixed(1)}<span className="text-lg text-muted-foreground">/100</span></p>
                <Badge className={`${RISCO_CLASS[calcRisco(scoreFree)!]} mt-2 text-base`}>
                  Risco {RISCO_LABEL[calcRisco(scoreFree)!]}
                </Badge>
              </div>
              <div className="text-left text-sm bg-accent rounded-lg p-4">
                <strong>⚠ Aviso:</strong> esta é uma amostra com 10 perguntas. O diagnóstico oficial NR-1
                requer 40 questões em 6 dimensões e aplicação a todos os colaboradores.
              </div>
              <Button onClick={() => navigate('/nr1/obrigado')} className="w-full nr1-bg-primary">
                Quero o diagnóstico completo da minha empresa
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      <footer className="border-t mt-10 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CompSmart · NR-1 conforme NR-01 atualizada (Portaria MTE 1.419/2024)
      </footer>
      <Footer />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' | 'bad' }) {
  const cls = tone === 'ok' ? 'nr1-risk-baixo' : tone === 'warn' ? 'nr1-risk-moderado' : 'nr1-risk-critico';
  return (
    <div className={`rounded-lg p-3 text-center ${cls}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

const GRAU_RISCO_OPTIONS = [
  { value: '1', label: 'Grau 1 — Risco Leve (1% RAT) · ex: escritórios, TI, comércio' },
  { value: '2', label: 'Grau 2 — Risco Médio (2% RAT) · ex: indústria leve, hotelaria, hospitais' },
  { value: '3', label: 'Grau 3 — Risco Grave (3% RAT) · ex: construção civil, química, transporte de carga' },
  { value: '4', label: 'Grau 4 — Risco Gravíssimo (3% RAT máx) · ex: mineração, petroquímica, energia' },
  { value: 'nao_sei', label: 'Não sei informar — quero ajuda do especialista' },
];

function ProposalForm() {
  const [data, setData] = useState({
    nome: '', email: '', empresa: '', cargo: '', telefone: '', whatsapp: '', tamanho_empresa: '', grau_risco: '', mensagem: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const schema = z.object({
    nome: z.string().trim().min(2, 'Informe seu nome').max(120),
    email: z.string().trim().email('Email inválido').max(255),
    empresa: z.string().trim().min(2, 'Informe a empresa').max(200),
    cargo: z.string().trim().max(120).optional().or(z.literal('')),
    telefone: z.string().trim().max(40).optional().or(z.literal('')),
    whatsapp: z.string().trim().max(40).optional().or(z.literal('')),
    tamanho_empresa: z.string().trim().max(40).optional().or(z.literal('')),
    grau_risco: z.string().trim().max(20).optional().or(z.literal('')),
    mensagem: z.string().trim().max(1000).optional().or(z.literal('')),
  });

  const submit = async () => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast({ title: 'Verifique os campos', description: parsed.error.issues[0]?.message, variant: 'destructive' });
      return;
    }
    setLoading(true);
    const extras: Record<string, string> = {};
    if (parsed.data.mensagem) extras.mensagem = parsed.data.mensagem;
    if (parsed.data.whatsapp) extras.whatsapp = parsed.data.whatsapp;
    if (parsed.data.grau_risco) extras.grau_risco_inss = parsed.data.grau_risco;
    const { error } = await supabase.from('nr1_leads').insert({
      nome: parsed.data.nome,
      email: parsed.data.email,
      empresa: parsed.data.empresa,
      cargo: parsed.data.cargo || null,
      telefone: parsed.data.telefone || null,
      tamanho_empresa: parsed.data.tamanho_empresa || null,
      respostas_free: Object.keys(extras).length ? extras : null,
      origem: 'landing_nr1_proposta',
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' });
      return;
    }
    setSent(true);
    toast({ title: 'Recebido!', description: 'Nossa equipe entra em contato em até 24h úteis.' });
  };

  if (sent) {
    return (
      <div className="text-center py-6 space-y-3">
        <ShieldCheck className="h-12 w-12 mx-auto nr1-text-primary" />
        <h3 className="text-xl font-bold">Obrigado! Recebemos sua solicitação.</h3>
        <p className="text-sm text-muted-foreground">
          Um especialista CompSmart entrará em contato em até <strong>24h úteis</strong> com uma proposta
          personalizada para sua empresa.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div>
        <Label htmlFor="pf-nome">Nome*</Label>
        <Input id="pf-nome" value={data.nome} onChange={(e) => setData({ ...data, nome: e.target.value })} maxLength={120} />
      </div>
      <div>
        <Label htmlFor="pf-email">Email corporativo*</Label>
        <Input id="pf-email" type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} maxLength={255} />
      </div>
      <div>
        <Label htmlFor="pf-empresa">Empresa*</Label>
        <Input id="pf-empresa" value={data.empresa} onChange={(e) => setData({ ...data, empresa: e.target.value })} maxLength={200} />
      </div>
      <div>
        <Label htmlFor="pf-cargo">Cargo</Label>
        <Input id="pf-cargo" value={data.cargo} onChange={(e) => setData({ ...data, cargo: e.target.value })} maxLength={120} />
      </div>
      <div>
        <Label htmlFor="pf-tel">Telefone</Label>
        <Input id="pf-tel" value={data.telefone} onChange={(e) => setData({ ...data, telefone: e.target.value })} maxLength={40} />
      </div>
      <div>
        <Label htmlFor="pf-wpp">WhatsApp</Label>
        <Input id="pf-wpp" placeholder="(11) 99999-9999" value={data.whatsapp} onChange={(e) => setData({ ...data, whatsapp: e.target.value })} maxLength={40} />
      </div>
      <div>
        <Label htmlFor="pf-tam">Nº de colaboradores</Label>
        <Input id="pf-tam" placeholder="ex: 250" value={data.tamanho_empresa} onChange={(e) => setData({ ...data, tamanho_empresa: e.target.value })} maxLength={40} />
      </div>
      <div>
        <Label htmlFor="pf-grau">Grau de risco INSS (CNAE)</Label>
        <Select value={data.grau_risco} onValueChange={(v) => setData({ ...data, grau_risco: v })}>
          <SelectTrigger id="pf-grau"><SelectValue placeholder="Selecione o grau de risco" /></SelectTrigger>
          <SelectContent>
            {GRAU_RISCO_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="pf-msg">Conte rapidamente seu contexto (opcional)</Label>
        <Input id="pf-msg" placeholder="Ex: precisamos implementar NR-1 antes de maio/2026 e já temos 9Box rodando" value={data.mensagem} onChange={(e) => setData({ ...data, mensagem: e.target.value })} maxLength={1000} />
      </div>
      <div className="md:col-span-2 pt-2">
        <Button onClick={submit} disabled={loading} className="w-full nr1-bg-primary text-white" size="lg">
          {loading ? 'Enviando...' : 'Quero falar com um especialista'}
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Resposta em até 24h úteis · Seus dados são tratados conforme LGPD.
        </p>
      </div>
    </div>
  );
}
