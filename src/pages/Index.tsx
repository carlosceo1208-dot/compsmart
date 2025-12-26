import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { SmartAgentsSection } from "@/components/landing/SmartAgentsSection";
import { TargetAudienceSection } from "@/components/landing/TargetAudienceSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { DifferentialsSection } from "@/components/landing/DifferentialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { FloatingTrialBanner } from "@/components/landing/FloatingTrialBanner";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkSession();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={isLoggedIn} />
      <HeroSection />
      <PainPointsSection />
      <SolutionSection />
      <SmartAgentsSection />
      <TargetAudienceSection />
      <HowItWorksSection />
      <DifferentialsSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <FloatingTrialBanner />
    </div>
  );
};

export default Index;
