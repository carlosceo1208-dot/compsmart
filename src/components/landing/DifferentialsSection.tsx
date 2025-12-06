import { Award, Globe2, HeartHandshake, Lock, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useScrollReveal, getStaggeredStyle } from "@/hooks/useScrollReveal";

export const DifferentialsSection = () => {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  const differentials = [
    {
      icon: Sparkles,
      title: "IA Integrada",
      description: "Agentes Inteligentes especializados em compliance, análise salarial e gestão de benefícios"
    },
    {
      icon: Globe2,
      title: "Presença Brasil + LATAM",
      description: "Solução desenvolvida para empresas brasileiras com expansão para toda América Latina"
    },
    {
      icon: HeartHandshake,
      title: "Consultoria Embutida",
      description: "Suporte humanizado e orientação estratégica inclusos na plataforma"
    },
    {
      icon: TrendingUp,
      title: "Dados de Mercado",
      description: "Benchmarking atualizado com pesquisas salariais reais"
    },
    {
      icon: Lock,
      title: "Segurança Enterprise",
      description: "LGPD compliant com criptografia e proteção de dados de nível corporativo"
    },
    {
      icon: Award,
      title: "Metodologia Comprovada",
      description: "Construído sobre as melhores práticas e metodologias consolidadas do mercado"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-secondary/10 via-background to-primary/5" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div 
            className="text-center mb-16"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
            }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Por que somos{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                diferentes?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Combinamos tecnologia de ponta com expertise em remuneração para entregar uma solução única no mercado
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {differentials.map((diff, index) => (
              <Card 
                key={index} 
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-background/80 backdrop-blur-sm border-primary/20"
                style={getStaggeredStyle(isVisible, index, 0.1)}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-primary rounded-xl flex-shrink-0">
                    <diff.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{diff.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {diff.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
