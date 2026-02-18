import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = 'avd_banner_dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const LaunchPromoBanner = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION_MS) {
        return;
      }
    }
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm animate-fade-in-up">
      <div className="relative bg-gradient-to-br from-primary via-primary to-secondary rounded-2xl p-5 shadow-2xl shadow-primary/25 border border-white/10">
        {/* Close button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl bg-white/10">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <Badge className="bg-white/20 text-white border-white/20 mb-1.5">
              Novidade!
            </Badge>
            <h3 className="text-white font-bold text-lg">
              Avaliação de Desempenho integrada
            </h3>
          </div>
        </div>

        {/* Value proposition */}
        <div className="bg-white/10 rounded-xl p-3 mb-4">
          <p className="text-white/90 text-sm">
            Remuneração + Desempenho em uma só plataforma — por menos de <strong>R$ 6/colaborador</strong>
          </p>
        </div>

        {/* CTA */}
        <Button 
          onClick={() => navigate('/auth')}
          className="w-full bg-white text-primary hover:bg-white/90 font-semibold group"
        >
          Começar Agora
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>

        {/* Fine print */}
        <p className="text-white/50 text-[10px] text-center mt-2">
          14 dias grátis • Sem cartão de crédito
        </p>
      </div>
    </div>
  );
};