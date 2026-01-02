import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  daysLeft: number;
  trialEndsAt: string;
}

export const TrialBanner = ({ daysLeft, trialEndsAt }: TrialBannerProps) => {
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);

  // Determine urgency level
  const getUrgencyConfig = () => {
    if (daysLeft <= 1) {
      return {
        bgClass: "bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700",
        textClass: "text-white",
        iconClass: "text-red-100",
        label: "URGENTE",
        message: daysLeft === 0 ? "Seu trial termina HOJE!" : "Último dia de trial!",
      };
    }
    if (daysLeft <= 3) {
      return {
        bgClass: "bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600",
        textClass: "text-amber-950 dark:text-white",
        iconClass: "text-amber-800 dark:text-amber-100",
        label: "IMPORTANTE",
        message: `Restam apenas ${daysLeft} dias de trial`,
      };
    }
    return {
      bgClass: "bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700",
      textClass: "text-white",
      iconClass: "text-emerald-100",
      label: "TRIAL GRATUITO",
      message: `${daysLeft} dias restantes`,
    };
  };

  const config = getUrgencyConfig();

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          "fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all hover:scale-105",
          config.bgClass,
          config.textClass
        )}
      >
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">{daysLeft} dias</span>
      </button>
    );
  }

  return (
    <div className={cn("w-full py-2 px-4 flex items-center justify-center gap-4 relative", config.bgClass)}>
      {/* Left: Badge + Message */}
      <div className="flex items-center gap-3">
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded bg-white/20", config.textClass)}>
          {config.label}
        </span>
        <Clock className={cn("h-4 w-4", config.iconClass)} />
        <span className={cn("text-sm font-medium", config.textClass)}>
          {config.message}
        </span>
      </div>

      {/* Center: CTA Button */}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => navigate("/pricing")}
        className="bg-white text-primary hover:bg-gray-100 shadow-md"
      >
        <Sparkles className="h-4 w-4 mr-1" />
        Assinar Agora
      </Button>

      {/* Right: Close Button */}
      <button
        onClick={() => setIsMinimized(true)}
        className={cn("absolute right-2 p-1 rounded-full hover:bg-white/20 transition-colors", config.iconClass)}
        aria-label="Minimizar banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
