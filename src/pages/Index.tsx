import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { LogoSlider } from "@/components/landing/LogoSlider";
import { AIShowcaseSection } from "@/components/landing/AIShowcaseSection";
import { WhatsNewSection } from "@/components/landing/WhatsNewSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { SmartAgentsSection } from "@/components/landing/SmartAgentsSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { TargetAudienceSection } from "@/components/landing/TargetAudienceSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { DifferentialsSection } from "@/components/landing/DifferentialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { FloatingTrialBanner } from "@/components/landing/FloatingTrialBanner";
import { LaunchPromoBanner } from "@/components/landing/LaunchPromoBanner";
import { LaunchConfetti } from "@/components/launch/LaunchConfetti";

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

  // Handle hash-based scrolling (e.g., /#pricing from checkout)
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <LaunchConfetti />
      <Header isLoggedIn={isLoggedIn} />
      <HeroSection />
      <TrustBar />
      <LogoSlider />
      <AIShowcaseSection />
      <WhatsNewSection />
      <PainPointsSection />
      <SolutionSection />
      <SmartAgentsSection />
      <SecuritySection />
      <TargetAudienceSection />
      <HowItWorksSection />
      <DifferentialsSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <FloatingTrialBanner />
      <LaunchPromoBanner />
    </div>
  );
};

export default Index;
