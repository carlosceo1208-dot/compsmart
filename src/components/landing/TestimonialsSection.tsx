import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Building2, Rocket, Target, Globe, TrendingUp, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Animated counter hook
const useAnimatedCounter = (end: number, duration: number = 2000, isVisible: boolean) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      countRef.current = Math.floor(easeOutQuart * end);
      setCount(countRef.current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration, isVisible]);

  return count;
};

export const TestimonialsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const empresasCount = useAnimatedCounter(1000, 2500, isVisible);
  const horasCount = useAnimatedCounter(40, 2000, isVisible);
  const precisionCount = useAnimatedCounter(99, 2000, isVisible);

  const stats = [
    {
      icon: Target,
      value: `${empresasCount.toLocaleString('pt-BR')}+`,
      label: "Empresas projetadas",
      sublabel: "para os primeiros 12 meses",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Building2,
      value: "Todos os Portes",
      label: "Plataforma flexível",
      sublabel: "de startups a grandes corporações",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Globe,
      value: "Brasil + LATAM",
      label: "Expansão planejada",
      sublabel: "para toda América Latina",
      gradient: "from-purple-500 to-violet-600"
    }
  ];

  const metrics = [
    {
      icon: TrendingUp,
      value: `${horasCount}h`,
      label: "economizadas/mês",
      description: "em processos manuais"
    },
    {
      icon: Users,
      value: `${precisionCount}%`,
      label: "de precisão",
      description: "nos cálculos de compa-ratio"
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-primary text-white px-4 py-1.5 mb-6">
              <Rocket className="h-4 w-4 mr-2" />
              Lançamento Janeiro 2026
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Visão e{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Números 2026
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Seja uma das primeiras empresas a transformar sua gestão de remuneração com IA
            </p>
          </div>

          {/* Main Stats */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {stats.map((stat, index) => (
              <Card 
                key={index}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `opacity 0.6s ease-out ${index * 0.2}s, transform 0.6s ease-out ${index * 0.2}s`
                }}
                className="p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className={`p-4 bg-gradient-to-br ${stat.gradient} rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="font-medium text-foreground">
                  {stat.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stat.sublabel}
                </p>
              </Card>
            ))}
          </div>

          {/* Secondary Metrics */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {metrics.map((metric, index) => (
              <div 
                key={index}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                  transition: `opacity 0.5s ease-out ${0.6 + index * 0.15}s, transform 0.5s ease-out ${0.6 + index * 0.15}s`
                }}
                className="flex items-center gap-4 bg-background/80 backdrop-blur-sm border border-border rounded-xl px-6 py-4 hover:border-primary/30 transition-colors"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <metric.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              🏆 Desenvolvido por especialistas em RH e Remuneração • 🔬 Metodologia baseada nas melhores práticas globais
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
