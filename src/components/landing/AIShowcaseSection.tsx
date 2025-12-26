import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Brain, AlertTriangle, TrendingUp, Award, Activity, BarChart3, Users, Zap } from "lucide-react";

export const AIShowcaseSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeAlert, setActiveAlert] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Rotate alerts every 3 seconds
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveAlert((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const aiAlerts = [
    {
      type: "error",
      icon: AlertTriangle,
      label: "Insight",
      message: "Detectada distorção salarial de 12% no departamento comercial em relação ao benchmark de mercado",
      detail: "Ação recomendada: revisar faixas salariais",
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/30"
    },
    {
      type: "warning",
      icon: TrendingUp,
      label: "Variação de Orçamento",
      message: "+8% acima do planejado para Q4",
      detail: "Projeção anual: R$ 2.4M → R$ 2.6M",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30"
    },
    {
      type: "success",
      icon: Award,
      label: "Oportunidade Detectada",
      message: "3 cargos elegíveis para promoção",
      detail: "Baseado em avaliação de desempenho",
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/30"
    }
  ];

  const miniMetrics = [
    { label: "Funcionários", value: "1,247", icon: Users, change: "+12" },
    { label: "Folha Mensal", value: "R$ 4.2M", icon: BarChart3, change: "+3%" },
    { label: "Alinhamento", value: "87%", icon: Activity, change: "+5%" }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-background via-primary/5 to-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="bg-gradient-primary text-white px-4 py-1.5 mb-6 text-sm">
              <Brain className="h-4 w-4 mr-2" />
              Inteligência Artificial em Ação
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Veja a{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Smart IA
              </span>{" "}
              trabalhando por você
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Análise em tempo real, detecção automática de problemas e alertas inteligentes para decisões estratégicas
            </p>
          </div>

          {/* Dashboard Preview */}
          <div 
            className="relative"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'all 0.8s ease-out'
            }}
          >
            {/* Dashboard Container */}
            <div className="relative bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              {/* Dashboard Header */}
              <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">CompSmart Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-green-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Análise em tempo real
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 grid lg:grid-cols-3 gap-6">
                {/* Left: Mini Metrics */}
                <div className="space-y-4">
                  {miniMetrics.map((metric, index) => (
                    <Card 
                      key={index}
                      className="p-4 bg-background/50 border-border/50"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                        transition: `all 0.5s ease-out ${0.3 + index * 0.1}s`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <metric.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{metric.label}</p>
                            <p className="text-lg font-bold">{metric.value}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                          {metric.change}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Center: AI Alerts */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Alertas Inteligentes</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {aiAlerts.length} ativos
                    </Badge>
                  </div>

                  {aiAlerts.map((alert, index) => (
                    <Card 
                      key={index}
                      className={`p-4 transition-all duration-500 ${
                        activeAlert === index 
                          ? `${alert.bg} ${alert.border} border-2 scale-[1.02]` 
                          : 'bg-background/50 border-border/50 opacity-70'
                      }`}
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                        transition: `all 0.5s ease-out ${0.4 + index * 0.1}s`
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${alert.bg}`}>
                          <alert.icon className={`h-5 w-5 ${alert.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${alert.bg} ${alert.color} border-0 text-xs`}>
                              {alert.label}
                            </Badge>
                            {activeAlert === index && (
                              <span className="text-xs text-muted-foreground animate-pulse">Processando...</span>
                            )}
                          </div>
                          <p className="font-medium text-foreground">{alert.message}</p>
                          <p className="text-sm text-muted-foreground mt-1">{alert.detail}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Dashboard Footer */}
              <div className="bg-muted/30 px-6 py-3 border-t border-border">
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Activity className="h-3 w-3" />
                    Análise em tempo real
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Brain className="h-3 w-3" />
                    Detecção automática
                  </span>
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    Alertas inteligentes
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};
