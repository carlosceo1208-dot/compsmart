import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { PivotHero } from "@/components/landing/pivot/PivotHero";
import { UrgencyBanner } from "@/components/landing/pivot/UrgencyBanner";
import { SecurityAssuranceStrip } from "@/components/landing/pivot/SecurityAssuranceStrip";
import { PainSection } from "@/components/landing/pivot/PainSection";
import { ModulesGridSection } from "@/components/landing/pivot/ModulesGridSection";
import { CrossDataSection } from "@/components/landing/pivot/CrossDataSection";
import { PivotHowItWorks } from "@/components/landing/pivot/PivotHowItWorks";
import { PayrollIntegrationsSection } from "@/components/landing/pivot/PayrollIntegrationsSection";
import { PricingSummarySection } from "@/components/landing/pivot/PricingSummarySection";
import { SocialProofPlaceholder } from "@/components/landing/pivot/SocialProofPlaceholder";
import {
  PivotFAQSection,
  PIVOT_FAQ_ITEMS,
} from "@/components/landing/pivot/PivotFAQSection";
import { PreFooterCTA } from "@/components/landing/pivot/PreFooterCTA";
import { VideoSection } from "@/components/landing/VideoSection";

/**
 * Home pública — posicionamento de Gestão Estratégica de Pessoas:
 * hero → dor → 9 módulos → diferencial do cruzamento → vídeo (secundário) →
 * como funciona → integração com a folha → preços → prova social (reservada) →
 * FAQ → pré-footer.
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
    <PublicLayout
      title="CompSmart — Gestão Estratégica de Pessoas com IA"
      description="Plataforma modular de gestão estratégica de pessoas: remuneração, NR-1, clima, seleção, desenvolvimento e sucessão, com um agente de IA em cada módulo."
      path="/"
    >
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
      <UrgencyBanner />
      <SecurityAssuranceStrip />
      <PainSection />
      <ModulesGridSection />
      <CrossDataSection />
      <VideoSection />
      <PivotHowItWorks />
      <PayrollIntegrationsSection />
      <PricingSummarySection />
      <SocialProofPlaceholder />
      <PivotFAQSection />
      <PreFooterCTA />
    </PublicLayout>
  );
};

export default Index;
