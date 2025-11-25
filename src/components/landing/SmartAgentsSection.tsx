import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Briefcase, FileText, Sparkles } from "lucide-react";

export const SmartAgentsSection = () => {
  const agents = [
    {
      icon: FileText,
      title: "Assistente Jurídico Smart",
      description: "Geração automática de contratos, políticas e análise de compliance trabalhista com referências legais atualizadas",
      badge: "Compliance"
    },
    {
      icon: Briefcase,
      title: "Agente de Análise Salarial",
      description: "Benchmarking de mercado, cálculo de compa-ratio e recomendações estratégicas para ajustes salariais",
      badge: "Análise"
    },
    {
      icon: Bot,
      title: "Assistente de R&B",
      description: "Consultoria especializada em incentivos de curto e longo prazo, benefícios e políticas de retenção",
      badge: "Consultoria"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-primary text-white px-4 py-1.5 mb-6 text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Diferencial Tecnológico
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Três{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Agentes Smart
              </span>{" "}
              trabalhando para você
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nossos agentes de IA especializados analisam, recomendam e geram documentos automaticamente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {agents.map((agent, index) => (
              <Card 
                key={index} 
                className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-primary/20 hover:border-primary/40 bg-background/80 backdrop-blur-sm"
              >
                {/* Gradient Overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full blur-2xl" />
                
                <CardHeader className="relative">
                  <Badge className="w-fit mb-3" variant="secondary">
                    {agent.badge}
                  </Badge>
                  <div className="p-4 bg-gradient-primary rounded-2xl w-fit mb-4 shadow-lg">
                    <agent.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{agent.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-sm leading-relaxed">
                    {agent.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              ✨ Powered by <strong>Lovable AI</strong> • 🔒 Dados protegidos e criptografados • 🇧🇷 Otimizado para legislação brasileira
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
