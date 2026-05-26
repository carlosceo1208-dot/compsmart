import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthCTA } from "@/hooks/useAuthCTA";
import {
  BarChart3,
  Globe2,
  Scale,
  Target,
  Wallet,
  Bot,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const CANONICAL = "https://www.compsmart.ia.br/plano-de-cargos-e-salarios";

const faqs = [
  {
    q: "O que é um plano de cargos e salários?",
    a: "É a estrutura formal que define cargos, faixas salariais, critérios de progressão e política de remuneração de uma empresa. No CompSmart, ele é construído com base em metodologia de pontos, pesquisa de mercado e análise de equidade interna.",
  },
  {
    q: "Quanto custa implantar um plano de cargos e salários?",
    a: "Com consultoria tradicional, projetos custam de R$ 30 mil a R$ 150 mil. Com o CompSmart, você implanta em semanas a partir de R$ 199/mês — sem consultor externo.",
  },
  {
    q: "Como funciona a pesquisa salarial integrada?",
    a: "Comparamos os salários da sua empresa com bases de mercado por cargo, região e setor, gerando alertas de defasagem e oportunidades de ajuste — Total Cash e Total Compensation incluídos nos planos Pro e Enterprise.",
  },
  {
    q: "O CompSmart faz folha de pagamento?",
    a: "Não. Somos remuneração estratégica — estruturação, comparação, equidade e desempenho. Integramos com o seu sistema de folha.",
  },
  {
    q: "Como o CompSmart trata equidade salarial?",
    a: "Dashboard dedicado com gap por gênero, dispersão por faixa, regressão de pay equity e alertas críticos. Acesso restrito a Administradores e RH.",
  },
];

const features = [
  {
    icon: BarChart3,
    title: "Tabela salarial inteligente",
    body: "Estruture faixas, grades e níveis com curvas automáticas. Ajuste por porte da empresa (pequena, média ou grande) com um clique.",
  },
  {
    icon: Globe2,
    title: "Pesquisa salarial e benchmark",
    body: "Compare seus salários com o mercado por cargo, região e setor. Total Cash e Total Compensation inclusos nos planos Pro e Enterprise.",
  },
  {
    icon: Scale,
    title: "Equidade salarial",
    body: "Análise de gap por gênero, área e faixa. Identifique riscos antes que virem passivo trabalhista.",
  },
  {
    icon: Target,
    title: "Gestão de desempenho integrada",
    body: "Avaliação 90°/180°/360°, 9Box, PDI e PerformAI — o agente de IA que conecta desempenho à remuneração estratégica.",
  },
  {
    icon: Wallet,
    title: "Planejamento orçamentário",
    body: "Simule mérito, reajuste coletivo e promoções com impacto financeiro em tempo real.",
  },
  {
    icon: Bot,
    title: "4 Agentes de IA",
    body: "Jurídico, Salary Smart, Rem&Benef e PerformAI trabalham por você — sem precisar de API key.",
  },
];

export default function LandingCargosSalarios() {
  const { ctaTo, isLoggedIn } = useAuthCTA();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Helmet>
        <title>Plano de Cargos e Salários com IA | CompSmart</title>
        <meta
          name="description"
          content="Monte seu plano de cargos e salários com tabela salarial, pesquisa de mercado e equidade — tudo em uma plataforma. Teste grátis por 14 dias."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content="Plano de Cargos e Salários com IA | CompSmart" />
        <meta
          property="og:description"
          content="Tabela salarial, pesquisa salarial, equidade e gestão de desempenho em uma só plataforma."
        />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        {/* Hero */}
        <section className="border-b">
          <div className="container mx-auto px-6 py-20 lg:py-28 max-w-5xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
              Remuneração Estratégica
            </p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Plano de cargos e salários, finalmente sob controle
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              O CompSmart unifica tabela salarial, pesquisa de mercado, equidade
              e gestão de desempenho em uma só plataforma — para que cada
              decisão de remuneração seja justa, competitiva e defensável.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={ctaTo}>
                <Button size="lg" className="gap-2">
                  {isLoggedIn ? 'Ir para o app' : 'Começar teste grátis de 14 dias'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">
                  Ver planos e preços
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Problema */}
        <section className="container mx-auto px-6 py-16 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Por que planilhas não dão mais conta?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                t: "Decisões sem dados",
                d: "Aumentos e promoções viram negociação, não meritocracia.",
              },
              {
                t: "Risco de inequidade",
                d: "Sem visão de equidade salarial por gênero, área e faixa, distorções crescem em silêncio.",
              },
              {
                t: "CFO sem previsibilidade",
                d: "Orçamento estoura porque mérito e coletivo são calculados na mão.",
              },
            ].map((c) => (
              <Card key={c.t}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{c.t}</h3>
                  <p className="text-muted-foreground text-sm">{c.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Solução */}
        <section className="bg-muted/30 border-y">
          <div className="container mx-auto px-6 py-16 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-10">
              Tudo que seu plano de cargos e salários precisa
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <Card key={f.title}>
                  <CardContent className="p-6">
                    <f.icon className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm">{f.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="container mx-auto px-6 py-16 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Do diagnóstico ao plano em 4 passos
          </h2>
          <ol className="space-y-4">
            {[
              "Importe seus dados — colaboradores, cargos e salários atuais em minutos.",
              "Estruture cargos e faixas — biblioteca viva de descrições e job matching com IA.",
              "Compare com o mercado — pesquisa salarial integrada, atualizada por setor.",
              "Decida com dados — dashboards de equidade, competitividade e orçamento.",
            ].map((step, i) => (
              <li key={i} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <p className="text-base pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Diferencial */}
        <section className="bg-muted/30 border-y">
          <div className="container mx-auto px-6 py-16 max-w-6xl grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Remuneração estratégica, não só folha de pagamento
              </h2>
              <p className="text-muted-foreground">
                A maioria das empresas trata desempenho e remuneração em
                sistemas separados — e perde coerência. O CompSmart é
                construído sob a visão de <strong>Talent Intelligence</strong>:
                avaliação alimenta remuneração, remuneração reforça
                comportamentos, e ambos guiam sucessão.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "Multi-empresa nativo (várias empresas em um login)",
                "LGPD por desenho, com RLS em todas as tabelas",
                "Indicadores econômicos ao vivo (INPC, dólar)",
                "Conversão de moeda para simulações internacionais",
              ].map((b) => (
                <li key={b} className="flex gap-2 items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-6 py-16 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Perguntas frequentes
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <Card key={f.q}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{f.q}</h3>
                  <p className="text-muted-foreground">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t bg-primary text-primary-foreground">
          <div className="container mx-auto px-6 py-16 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pare de decidir aumento no escuro
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Teste grátis por 14 dias. Sem cartão. Sem implantação.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={ctaTo}>
                <Button size="lg" variant="secondary" className="gap-2">
                  {isLoggedIn ? 'Ir para o app' : 'Começar agora'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Falar com especialista
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
