import { Play } from "lucide-react";
import { useEffect, useRef } from "react";

const Confetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || 800;
      canvas.height = canvas.parentElement?.offsetHeight || 600;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
    const pieces = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 8 + 4,
      h: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 2 + 1,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
      drift: (Math.random() - 0.5) * 1.5,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        p.y += p.speed;
        p.x += p.drift;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};

export const VideoSection = () => {
  return (
    <section className="relative py-20 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <Confetti />
      <div className="container mx-auto px-4 max-w-3xl text-center relative z-20">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Planilhas ou Inteligência?{" "}
          <span className="text-primary">
            Veja como a CompSmart elimina o trabalho exaustivo da revisão salarial.
          </span>
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          Assista ao diálogo entre um CEO e uma HR Manager e descubra por que empresas de alto crescimento estão abandonando os processos manuais.
        </p>

        <div className="relative rounded-xl overflow-hidden shadow-2xl border border-primary/10 aspect-video group">
          <iframe
            src="https://www.youtube.com/embed/KWeXhzaJYU4"
            title="CompSmart - Ciclo Salarial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            loading="lazy"
          />
          {/* Overlay text matching published page */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pointer-events-none">
            <p className="text-white font-bold text-sm md:text-base text-left">
              Veja como a inteligência trabalha COM você
            </p>
            <p className="text-white/70 text-xs text-left flex items-center gap-1 mt-1">
              📊 ~5 minutos que podem transformar seu RH
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Play className="h-4 w-4 text-primary" />
          <span>~5 minutos que podem transformar seu RH</span>
        </div>
      </div>
    </section>
  );
};
