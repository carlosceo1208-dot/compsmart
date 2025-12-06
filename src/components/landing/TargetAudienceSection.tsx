import { Building2, Factory, Landmark } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useScrollReveal, getStaggeredStyle } from "@/hooks/useScrollReveal";

export const TargetAudienceSection = () => {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  const audiences = [
    {
      icon: Building2,
      size: "Pequena Empresa",
      range: "Até 99 funcionários",
      revenue: "Até R$ 4,8 milhões/ano",
      description: "Estrutura simples com foco em organização e crescimento controlado",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Factory,
      size: "Média Empresa",
      range: "100 a 499 funcionários",
      revenue: "R$ 4,8 a 300 milhões/ano",
      description: "Áreas funcionais claras com necessidade de especialização e compliance",
      color: "from-blue-500 to-cyan-600",
      highlighted: true
    },
    {
      icon: Landmark,
      size: "Grande Empresa",
      range: "500+ funcionários",
      revenue: "Acima de R$ 300 milhões/ano",
      description: "Estrutura consolidada com foco em equidade e competitividade estratégica",
      color: "from-purple-500 to-violet-600"
    }
  ];

  return (
    <section className="py-20 bg-muted/30" ref={ref}>
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
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                CompSmart
              </span>{" "}
              para Todos os Portes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A plataforma CompSmart se adapta às necessidades de cada segmento empresarial — de startups a grandes corporações
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((audience, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={getStaggeredStyle(isVisible, index, 0.15)}
              >
                <CardHeader>
                  <div className={`p-4 bg-gradient-to-br ${audience.color} rounded-2xl w-fit mb-4 shadow-lg`}>
                    <audience.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{audience.size}</CardTitle>
                  <CardDescription className="text-sm font-semibold text-foreground">
                    {audience.range}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Faturamento:</span> {audience.revenue}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {audience.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
