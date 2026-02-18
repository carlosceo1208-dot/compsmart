import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { VideoSection } from "@/components/landing/VideoSection";
import { BeforeAfterSection } from "@/components/landing/BeforeAfterSection";
import { InteractiveDemoSection } from "@/components/landing/InteractiveDemoSection";
import { IntegrationSection } from "@/components/landing/IntegrationSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SmartAgentsSection } from "@/components/landing/SmartAgentsSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { CompetitiveComparisonSection } from "@/components/landing/CompetitiveComparisonSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { LaunchPromoBanner } from "@/components/landing/LaunchPromoBanner";
import { StickyCTABar } from "@/components/landing/StickyCTABar";

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
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={isLoggedIn} />
      <HeroSection />
      <VideoSection />
      <BeforeAfterSection />
      <InteractiveDemoSection />
      <IntegrationSection />
      <HowItWorksSection />
      <SmartAgentsSection />
      <SocialProofSection />
      <CompetitiveComparisonSection />
      <SecuritySection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <LaunchPromoBanner />
      <StickyCTABar />
    </div>
  );
};

export default Index;