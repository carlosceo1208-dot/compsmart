import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthCTA } from "@/hooks/useAuthCTA";

export const StickyCTABar = () => {
  const navigate = useNavigate();
  const { ctaTo, ctaLabel } = useAuthCTA();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative z-10 bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm min-w-0 flex-1 overflow-hidden">
          <Sparkles className="h-4 w-4 shrink-0" />
          <div className="overflow-hidden whitespace-nowrap">
            <span className="inline-block animate-[marquee_18s_linear_infinite]">
              🚀 2 Ferramentas Estratégicas Completas totalmente customizável por apenas menos do que R$ 6,00 em média p/ colaborador — <strong className="text-secondary bg-secondary/20 px-2 py-0.5 rounded">Trial 30 dias grátis</strong> &nbsp;&nbsp;&nbsp;⭐&nbsp;&nbsp;&nbsp; 🚀 2 Ferramentas Estratégicas Completas totalmente customizável por apenas menos do que R$ 6,00 em média p/ colaborador — <strong className="text-secondary bg-secondary/20 px-2 py-0.5 rounded">Trial 30 dias grátis</strong> &nbsp;&nbsp;&nbsp;⭐&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            className="bg-card text-primary hover:bg-card/90 text-xs font-bold"
            onClick={() => navigate(ctaTo)}
          >
            {ctaLabel}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-primary-hover rounded"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
