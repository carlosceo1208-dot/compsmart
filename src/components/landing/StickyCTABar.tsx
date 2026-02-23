import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const StickyCTABar = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let scrollHandler: (() => void) | null = null;

    const show = () => {
      if (!dismissed) setVisible(true);
    };

    timer = setTimeout(show, 30000);

    scrollHandler = () => {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.5) show();
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });

    return () => {
      clearTimeout(timer);
      if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
    };
  }, [dismissed]);

  // Reappear after 2min
  useEffect(() => {
    if (!dismissed) return;
    const timer = setTimeout(() => {
      setDismissed(false);
      setVisible(true);
    }, 120000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:bottom-auto md:top-0 bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm min-w-0 flex-1 overflow-hidden">
          <Sparkles className="h-4 w-4 shrink-0" />
          <div className="overflow-hidden whitespace-nowrap">
            <span className="inline-block animate-[marquee_18s_linear_infinite]">
              🚀 2 Ferramentas Estratégicas Completas totalmente customizável por apenas menos do que R$ 6,00 em média p/ colaborador — <strong className="text-secondary bg-secondary/20 px-2 py-0.5 rounded">Trial 14 dias grátis</strong> &nbsp;&nbsp;&nbsp;⭐&nbsp;&nbsp;&nbsp; 🚀 2 Ferramentas Estratégicas Completas totalmente customizável por apenas menos do que R$ 6,00 em média p/ colaborador — <strong className="text-secondary bg-secondary/20 px-2 py-0.5 rounded">Trial 14 dias grátis</strong> &nbsp;&nbsp;&nbsp;⭐&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-card text-primary hover:bg-card/90 text-xs font-bold"
            onClick={() => navigate("/auth")}
          >
            Começar Agora
          </Button>
          <button
            onClick={() => { setDismissed(true); setVisible(false); }}
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