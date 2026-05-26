import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { LogoSlider } from "@/components/landing/LogoSlider";
import { BeforeAfterSection } from "@/components/landing/BeforeAfterSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { InteractiveDemoSection } from "@/components/landing/InteractiveDemoSection";
import { SmartAgentsSection } from "@/components/landing/SmartAgentsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { LaunchPromoBanner } from "@/components/landing/LaunchPromoBanner";
import { StickyCTABar } from "@/components/landing/StickyCTABar";
import { Nr1HighlightBanner } from "@/components/landing/Nr1HighlightBanner";

/**
 * Landing page — fluxo enxuto AIDA + StoryBrand:
 * 1. Hero (atenção + proposta de valor + CTA)
 * 2. LogoSlider (prova social leve, imediata)
 * 3. BeforeAfter (problema concreto)
 * 4. Solution (solução em alto nível)
 * 5. InteractiveDemo (produto na prática)
 * 6. SmartAgents (diferencial IA)
 * 7. HowItWorks (3 passos para começar)
 * 8. Pricing (decisão)
 * 9. SocialProof (depoimentos profundos)
 * 10. Security (confiança/objeções)
 * 11. FAQ + CTA final
 *
 * Removidos para evitar repetição com as seções acima:
 *   VideoSection, IntegrationSection, TargetAudienceSection,
 *   DifferentialsSection, CompetitiveComparisonSection.
 * (Componentes preservados no codebase — basta re-importar para reativar.)
 */
const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkSession();
  }, []);

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
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={isLoggedIn} />

      {/* 1. Atenção */}
      <HeroSection />

      {/* 1.5. Destaque NR-1 — urgência regulatória + categoria nova */}
      <Nr1HighlightBanner />

      {/* 2. Prova social imediata */}
      <LogoSlider />

      {/* 3. Problema */}
      <BeforeAfterSection />

      {/* 4. Solução */}
      <SolutionSection />

      {/* 5. Produto na prática */}
      <InteractiveDemoSection />

      {/* 6. Diferencial IA */}
      <SmartAgentsSection />

      {/* 7. Como começar */}
      <HowItWorksSection />

      {/* 8. Decisão */}
      <PricingSection />

      {/* 9. Prova social profunda */}
      <SocialProofSection />

      {/* 10. Confiança */}
      <SecuritySection />

      {/* 11. Objeções + CTA final */}
      <FAQSection />
      <CTASection />

      <Footer />
      <LaunchPromoBanner />
      <StickyCTABar />
    </div>
  );
};

export default Index;
