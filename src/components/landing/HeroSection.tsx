import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { ImpactCalculator } from "./ImpactCalculator";
import { useState, useEffect, useRef } from "react";

const COMPANY_CYCLE = [1, 2, 3, 2, 1, 3, 2];
const LiveCompanyCounter = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % COMPANY_CYCLE.length);
    }, 240_000 + Math.random() * 60_000); // ~4-5 min
    return () => clearInterval(interval);
  }, []);
  const count = COMPANY_CYCLE[idx];
  return (
    <div className="flex justify-end">
      <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 animate-pulse-slow transition-all">
        🔥 <strong>{count} empresa{count > 1 ? "s" : ""}</strong> avaliando agora
      </Badge>
    </div>
  );
};

const AnimatedCounter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const duration = 1500;
        const startTime = performance.now();
        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString("pt-BR")}{suffix}</span>;
};

export const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-gradient-to-br from-background via-primary/3 to-secondary/5">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Eyebrow */}
        <div className="flex justify-center mb-6">
          <Badge className="bg-secondary/10 text-secondary border-secondary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 mr-2" />
            Gestão Estratégica de Remuneração com Avaliação de Desempenho Integrada
          </Badge>
        </div>

        {/* Split layout */}
        <div className="grid lg:grid-cols-[45%_55%] gap-10 items-start max-w-6xl mx-auto">
          {/* Left - Calculator */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-foreground">
              Quanto tempo sua empresa perde com{" "}
              <span className="text-primary">planilhas de RH</span>?
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Empresas líderes exigem mais que planilhas. Com a CompSmart, você e a inteligência artificial orquestram toda a gestão de <strong className="text-foreground">Cargos, Salários, Benefícios, Incentivos e Desempenho</strong>. Transforme sua remuneração em <strong className="text-primary">vantagem estratégica decisiva</strong>.
            </p>
            <ImpactCalculator />
          </div>

          {/* Right - Dashboard Preview */}
          <div className="hidden lg:block space-y-6">
            {/* Animated dashboard mockup */}
            <div className="bg-card border rounded-xl shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Dashboard CompSmart</h3>
                <Badge variant="outline" className="text-xs">Live</Badge>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/5 rounded-lg p-3 text-center">
                  <BarChart3 className="h-4 w-4 text-secondary mx-auto mb-1" />
                  <p className="text-lg font-bold text-secondary"><AnimatedCounter target={94} suffix="%" /></p>
                  <p className="text-[10px] text-muted-foreground">Dentro da Faixa</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 text-center">
                  <DollarSign className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold text-primary">R$ <AnimatedCounter target={12} />,4M</p>
                  <p className="text-[10px] text-muted-foreground">Folha Anual</p>
                </div>
                <div className="bg-warning/5 rounded-lg p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-warning mx-auto mb-1" />
                  <p className="text-lg font-bold text-warning"><AnimatedCounter target={23} /></p>
                  <p className="text-[10px] text-muted-foreground">Avaliações Pendentes</p>
                </div>
              </div>

              {/* Animated bars */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Distribuição Salarial por Faixa</p>
                {[
                  { label: "Abaixo", pct: 12, color: "bg-destructive" },
                  { label: "Dentro", pct: 73, color: "bg-secondary" },
                  { label: "Acima", pct: 15, color: "bg-warning" },
                ].map((bar) => (
                  <div key={bar.label} className="flex items-center gap-2">
                    <span className="text-[10px] w-12 text-muted-foreground">{bar.label}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bar.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${bar.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium w-8">{bar.pct}%</span>
                  </div>
                ))}
              </div>

              {/* Mini salary curve */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Curva Salarial</p>
                <div className="flex items-end gap-1 h-16">
                  {[30, 42, 55, 62, 70, 78, 85, 90, 95, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/60 rounded-t transition-all duration-700"
                      style={{ height: `${h}%`, transitionDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <LiveCompanyCounter />
          </div>
        </div>

        {/* Mobile counter */}
        <div className="lg:hidden flex justify-center mt-6">
          <LiveCompanyCounter />
        </div>
      </div>
    </section>
  );
};
