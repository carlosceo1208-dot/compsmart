import { useState, useEffect } from "react";
import { X, Sparkles, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "compsmart_trial_banner_closed";
const HOURS_TO_HIDE = 24;

export const FloatingTrialBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if banner was closed recently
    const closedAt = localStorage.getItem(STORAGE_KEY);
    if (closedAt) {
      const closedTime = parseInt(closedAt, 10);
      const now = Date.now();
      const hoursPassed = (now - closedTime) / (1000 * 60 * 60);
      
      if (hoursPassed < HOURS_TO_HIDE) {
        return; // Don't show banner
      }
    }

    // Show banner after scroll/time
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 18000); // 18 seconds

    // Also show on scroll
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  const handleStartTrial = () => {
    handleClose();
    navigate("/onboarding");
  };

  const handleQuestions = () => {
    handleClose();
    navigate("/pricing#faq");
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isClosing 
          ? "opacity-0 translate-y-4 scale-95" 
          : "opacity-100 translate-y-0 scale-100"
      }`}
    >
      <Card className="relative w-80 p-5 shadow-2xl border-primary/30 bg-background/95 backdrop-blur-md">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Fechar banner"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-primary rounded-xl">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-lg pr-6">
            Tem dúvidas sobre a plataforma?
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Experimente o CompSmart por <span className="font-semibold text-primary">14 dias GRÁTIS</span> — sem compromisso e sem cartão!
        </p>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleStartTrial}
            className="flex-1 bg-gradient-primary hover:opacity-90 text-white"
          >
            Começar Trial
          </Button>
          <Button 
            onClick={handleQuestions}
            variant="outline"
            className="flex-shrink-0"
          >
            <MessageCircleQuestion className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
