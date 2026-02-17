import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Briefcase, FileText, Sparkles, Clock, TrendingUp, Shield, Zap, Brain, Target } from "lucide-react";
import avatarWoman2 from "@/assets/avatar-woman-2.png";
import avatarMan1 from "@/assets/avatar-man-1.png";
import avatarWoman1 from "@/assets/avatar-woman-1.png";
import avatarWoman3 from "@/assets/avatar-woman-3.png";
import { useScrollReveal, getStaggeredStyle } from "@/hooks/useScrollReveal";

export const SmartAgentsSection = () => {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  const agents = [
    {
      icon: FileText,
      title: "Jurídico Smart",
      description: "Geração automática de contratos, políticas e análise de compliance trabalhista com referências legais atualizadas",
      badge: "Compliance",
      avatar: avatarWoman2,
      metrics: [
        { icon: Clock, value: "80%", label: "menos tempo em compliance" },
        { icon: Shield, value: "100%", label: "atualizado com CLT" }
      ],
      capabilities: ["Contratos", "Políticas", "Alertas Legais"]
    },
    {
      icon: Briefcase,
      title: "Salary Smart",
      description: "Benchmarking de mercado, cálculo de compa-ratio e recomendações estratégicas para ajustes salariais",
      badge: "Análise",
      avatar: avatarMan1,
      metrics: [
        { icon: TrendingUp, value: "500+", label: "pesquisas analisadas" },
        { icon: Zap, value: "Segundos", label: "para insights" }
      ],
      capabilities: ["Benchmark", "Compa-Ratio", "Tendências"]
    },
    {
      icon: Bot,
      title: "R&B Smart",
      description: "Consultoria especializada em incentivos de curto e longo prazo, benefícios e políticas de retenção",
      badge: "Consultoria",
      avatar: avatarWoman1,
      metrics: [
        { icon: TrendingUp, value: "ICP/ILP", label: "estruturação completa" },
        { icon: Shield, value: "ROI", label: "calculado" }
      ],
      capabilities: ["Incentivos", "Benefícios", "Retenção"]
    },
    {
      icon: Brain,
      title: "PerformAI",
      description: "Agente especializado em avaliação de desempenho: elabora feedbacks, gera PDIs automáticos, analisa 9Box e cria devolutivas personalizadas",
      badge: "Desempenho",
      avatar: avatarWoman3,
      metrics: [
        { icon: Target, value: "360°", label: "avaliação completa" },
        { icon: Zap, value: "PDI", label: "gerado por IA" }
      ],
      capabilities: ["Feedbacks", "PDI", "9Box", "Devolutivas"]
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-background relative overflow-hidden" ref={ref}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div 
            className="text-center mb-16"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
            }}
          >
            <Badge className="bg-gradient-primary text-white px-4 py-1.5 mb-6 text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Diferencial Tecnológico
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Agentes Inteligentes
              </span>{" "}
              COM Você
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nossos agentes especializados analisam, recomendam e geram documentos — trabalhando ao seu lado como parceiros estratégicos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map((agent, index) => (
              <Card 
                key={index} 
                className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-primary/20 hover:border-primary/40 bg-background/80 backdrop-blur-sm group"
                style={getStaggeredStyle(isVisible, index, 0.15)}
              >
                {/* Gradient Overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity" />
                
                <CardHeader className="relative">
                  <div className="flex items-center gap-4 mb-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      <AvatarImage src={agent.avatar} alt={agent.title} />
                      <AvatarFallback>{agent.title[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Badge className="w-fit mb-1" variant="secondary">
                        {agent.badge}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-primary rounded-2xl w-fit mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <agent.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{agent.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {agent.description}
                  </CardDescription>
                  
                  {/* Metrics */}
                  <div className="flex gap-4 pt-2">
                    {agent.metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                          <metric.icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-primary">{metric.value}</div>
                          <div className="text-[10px] text-muted-foreground">{metric.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {agent.capabilities.map((cap, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-[10px] px-2 py-0.5 bg-background/50"
                      >
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div 
            className="mt-12 text-center space-y-4"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.6s ease-out 0.6s, transform 0.6s ease-out 0.6s",
            }}
          >
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2 hover:text-foreground transition-colors">
                🔒 <strong>Segurança Corporativa</strong>
              </span>
              <span className="flex items-center gap-2 hover:text-foreground transition-colors">
                🔐 <strong>Criptografia Ponta a Ponta</strong>
              </span>
              <span className="flex items-center gap-2 hover:text-foreground transition-colors">
                📜 <strong>Totalmente em Conformidade com a LGPD</strong>
              </span>
              <span className="flex items-center gap-2 hover:text-foreground transition-colors">
                🇧🇷 <strong>Otimizado para a Legislação Brasileira</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
