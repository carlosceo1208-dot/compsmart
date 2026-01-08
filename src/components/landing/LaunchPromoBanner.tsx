import { useState, useEffect } from "react";
import { X, Rocket, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const LAUNCH_END_DATE = '2026-02-06';
const STORAGE_KEY = 'launch_promo_dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const LaunchPromoBanner = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  // Check if banner was dismissed recently
  useEffect(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION_MS) {
        return; // Still within dismiss period
      }
    }
    
    // Show after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    const targetDate = new Date(LAUNCH_END_DATE + 'T23:59:59-03:00').getTime();
    
    const updateCountdown = () => {
      const now = Date.now();
      const difference = targetDate - now;
      
      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        });
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
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
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <div>
            <Badge className="bg-white/20 text-white border-white/20 mb-1.5">
              Oferta de Lançamento
            </Badge>
            <h3 className="text-white font-bold text-lg">
              30% OFF em todos os planos!
            </h3>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-white/10 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 text-white/80 text-xs mb-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Oferta expira em:</span>
          </div>
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{countdown.days}</div>
              <div className="text-[10px] text-white/60 uppercase">dias</div>
            </div>
            <div className="text-white/40 text-xl">:</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{countdown.hours.toString().padStart(2, '0')}</div>
              <div className="text-[10px] text-white/60 uppercase">horas</div>
            </div>
            <div className="text-white/40 text-xl">:</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{countdown.minutes.toString().padStart(2, '0')}</div>
              <div className="text-[10px] text-white/60 uppercase">min</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button 
          onClick={() => navigate('/auth')}
          className="w-full bg-white text-primary hover:bg-white/90 font-semibold group"
        >
          Garantir Desconto
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>

        {/* Fine print */}
        <p className="text-white/50 text-[10px] text-center mt-2">
          Válido para novos assinantes até 06/02/2026
        </p>
      </div>
    </div>
  );
};