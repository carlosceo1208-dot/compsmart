import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { DemoDialog } from "@/components/landing/public/DemoDialog";
import { Button } from "@/components/ui/button";
import { PivotHero } from "@/components/landing/pivot/PivotHero";
import { SecurityAssuranceStrip } from "@/components/landing/pivot/SecurityAssuranceStrip";
import { PainSection } from "@/components/landing/pivot/PainSection";
import { PlatformConsultingSection } from "@/components/landing/pivot/PlatformConsultingSection";
import { CrossDataSection } from "@/components/landing/pivot/CrossDataSection";
import { MaturitySection } from "@/components/landing/pivot/MaturitySection";
import { ModulesGridSection } from "@/components/landing/pivot/ModulesGridSection";
import { RecruitmentSection } from "@/components/landing/pivot/RecruitmentSection";
import { PricingSimulator } from "@/components/landing/pivot/PricingSimulator";
import { DiagnosticoCTA } from "@/components/landing/pivot/DiagnosticoCTA";
import { MaterialsSection } from "@/components/landing/pivot/MaterialsSection";
import { SocialProofPlaceholder } from "@/components/landing/pivot/SocialProofPlaceholder";
import { PivotFAQSection, PIVOT_FAQ_ITEMS } from "@/components/landing/pivot/PivotFAQSection";
import { PreFooterCTA } from "@/components/landing/pivot/PreFooterCTA";
import { VisualProofSection } from "@/components/landing/pivot/VisualProofSection";
import { VideoSection } from "@/components/landing/VideoSection";

/**
 * Home pública: aviso NR-1 + hero → contraponto → plataforma + consultoria →
 * diferencial → maturidade → 8 agentes → recrutamento → simulador → materiais →
 * demonstração → empresas-piloto → FAQ → fechamento. SEO só por seoRoutes.ts.
 */
const Index = () => {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, [location.hash]);

  return (
    <PublicLayout path="/">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: PIVOT_FAQ_ITEMS.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          })}
        </script>
      </Helmet>

      <PivotHero />
      <SecurityAssuranceStrip />
      <PainSection />
      <PlatformConsultingSection />
      <CrossDataSection />
      <MaturitySection />
      <ModulesGridSection />
      <RecruitmentSection />

      <section id="precos" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-bold">Simule seu investimento</h2>
            <p className="mt-3 text-muted-foreground">
              Escolha os módulos e o número de colaboradores. Valor por colaborador, com desconto a partir do 2º módulo.
            </p>
          </div>
          <PricingSimulator
            selectModules
            actions={
              <>
                <DemoDialog triggerLabel="Fale com um especialista" className="w-full" />
                <DiagnosticoCTA id="cta-simulador-diagnostico" variant="outline" size="default" className="w-full" label="Diagnóstico gratuito" />
              </>
            }
          />
          <div className="text-center mt-6">
            <Button asChild variant="link" id="cta-simulador-precos">
              <Link to="/precos">Ver preços por porte</Link>
            </Button>
          </div>
        </div>
      </section>

      <MaterialsSection variant="compact" />
      <div id="demonstracao" className="scroll-mt-28">
        <VideoSection />
      </div>
      <SocialProofPlaceholder />
      <VisualProofSection />
      <PivotFAQSection />
      <PreFooterCTA />
    </PublicLayout>
  );
};

export default Index;
