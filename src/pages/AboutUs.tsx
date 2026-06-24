import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { useAuthCTA } from "@/hooks/useAuthCTA";

const AboutUs = () => {
  const { ctaTo, ctaLabel } = useAuthCTA();
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sobre Nós — CompSmart | Remuneração Estratégica + NR-1</title>
        <meta name="description" content="Conheça a CompSmart: plataforma brasileira criada por executivos de RH para tornar a gestão de remuneração, desempenho e NR-1 simples, auditável e orientada por dados." />
        <link rel="canonical" href="https://www.compsmart.ia.br/sobre-nos" />
        <meta property="og:title" content="Sobre Nós — CompSmart" />
        <meta property="og:description" content="Quem somos, nossa experiência executiva em RH e a visão por trás da plataforma CompSmart." />
        <meta property="og:url" content="https://www.compsmart.ia.br/sobre-nos" />
        <meta name="twitter:title" content="Sobre Nós — CompSmart" />
        <meta name="twitter:description" content="A história e a equipe por trás da plataforma CompSmart de remuneração estratégica." />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'Sobre a CompSmart',
            url: 'https://www.compsmart.ia.br/sobre-nos',
            about: { '@type': 'Organization', name: 'CompSmart', url: 'https://www.compsmart.ia.br' },
          })}
        </script>
      </Helmet>
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={compsmartLogo} alt="CompSmart" className="h-10 w-auto" />
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Sobre Nós</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <section className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Nossa Plataforma</h2>
            <p className="text-muted-foreground leading-relaxed">
              A CompSmart é uma plataforma desenvolvida para apoiar empresas na gestão estratégica de remuneração, 
              elevando o nível de governança, eficiência e consistência dos processos. Nosso objetivo é transformar 
              rotinas tradicionalmente manuais — como revisão salarial, estrutura de cargos, faixas salariais, 
              planejamento orçamentário de salários e headcount — em uma operação padronizada, rastreável, auditável 
              e orientada por dados.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Nossa Experiência</h2>
            <p className="text-muted-foreground leading-relaxed">
              A solução foi criada por profissionais com ampla experiência executiva em RH e Operações, com atuação 
              em organizações multinacionais e nacionais e vivência prática em transformação organizacional, programas 
              de eficiência, modelos de Remuneração, Benefícios e Governança de indicadores. Essa experiência foi 
              construída ao longo do tempo "no campo", acompanhando de perto a pressão real de ciclos de orçamento 
              e decisões críticas sobre profissionais, talentos, carreira — e por isso a CompSmart foi desenhada para 
              ser simples de operar, rápida na análise e confiável na tomada de decisão.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Inteligência Artificial</h2>
            <p className="text-muted-foreground leading-relaxed">
              A CompSmart incorpora Inteligência Artificial para apoiar o time na organização e interpretação das 
              informações, reduzindo o esforço operacional e liberando energia para o que realmente importa: decisões 
              estratégicas, equidade interna, competitividade de mercado e sustentabilidade orçamentária.
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Benefícios e Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Com a CompSmart, sua empresa ganha padronização, análises inteligentes e uma visão clara do impacto 
              financeiro das decisões de remuneração, com dados que fazem sentido para Executivos de RH, CEOs, 
              Finanças. Tudo isso com atenção rigorosa à segurança e à confidencialidade de informações sensíveis, 
              reforçando credibilidade e confiança no processo do início ao fim.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link to={ctaTo}>{ctaLabel}</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CompSmart. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
