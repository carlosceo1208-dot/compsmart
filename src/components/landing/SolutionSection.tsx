import { BarChart3, CheckCircle2, Database, FileText, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const SolutionSection = () => {
  const solutions = [
    {
      icon: BarChart3,
      title: "Estrutura de Cargos e Faixas",
      description: "Crie grades, níveis e famílias de cargos com pontos médios e amplitudes automáticas"
    },
    {
      icon: Database,
      title: "Benchmark de Mercado com IA",
      description: "Compare sua remuneração com dados reais do mercado e receba recomendações inteligentes"
    },
    {
      icon: CheckCircle2,
      title: "Gestão de PLR e Incentivos",
      description: "Configure programas de ICP, ILP, bônus e comissões com regras claras e automáticas"
    },
    {
      icon: Shield,
      title: "Compliance Automático",
      description: "Agente jurídico integrado verifica conformidade trabalhista e previdenciária"
    },
    {
      icon: FileText,
      title: "Dashboards Inteligentes",
      description: "Visualize KPIs, análises e tendências em tempo real com relatórios prontos"
    },
    {
      icon: Zap,
      title: "Automação Completa",
      description: "Elimine planilhas e processos manuais com workflows inteligentes"
    }
  ];

  return (
    <section id="solution" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              O que o{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                CompSmart
              </span>{" "}
              entrega
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa e integrada para gestão estratégica de remuneração e benefícios
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((solution, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
                <CardHeader>
                  <div className="p-3 bg-gradient-primary rounded-xl w-fit mb-2">
                    <solution.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{solution.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {solution.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
