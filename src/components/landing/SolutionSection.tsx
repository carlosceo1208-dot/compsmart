import { BarChart3, CheckCircle2, Database, FileText, Shield, Zap, Brain, TrendingUp, Users, Calculator } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";

export const SolutionSection = () => {
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const solutionCategories = [
    {
      category: "Core",
      categoryColor: "text-green-600 dark:text-green-400",
      categoryBg: "bg-green-500/10",
      solutions: [
        {
          icon: BarChart3,
          title: "Estrutura de Cargos e Faixas",
          description: "Crie grades, níveis e famílias de cargos com pontos médios e amplitudes automáticas",
          isNew: false
        },
        {
          icon: Users,
          title: "Gestão de Funcionários",
          description: "Cadastro completo com foto, dados e histórico de movimentações salariais",
          isNew: false
        }
      ]
    },
    {
      category: "Insight",
      categoryColor: "text-blue-600 dark:text-blue-400",
      categoryBg: "bg-blue-500/10",
      solutions: [
        {
          icon: Database,
          title: "Benchmark de Mercado com IA",
          description: "Compare sua remuneração com dados reais do mercado e receba recomendações inteligentes",
          isNew: true
        },
        {
          icon: TrendingUp,
          title: "Modelagem Preditiva",
          description: "Previsão de custo de folha para 12-36 meses com projeções automáticas de crescimento",
          isNew: true
        },
        {
          icon: FileText,
          title: "Análise de Equidade Interna",
          description: "Comparações detalhadas por área, nível hierárquico, faixa salarial e gênero",
          isNew: false
        }
      ]
    },
    {
      category: "Match",
      categoryColor: "text-purple-600 dark:text-purple-400",
      categoryBg: "bg-purple-500/10",
      solutions: [
        {
          icon: CheckCircle2,
          title: "Simulações de Política Salarial",
          description: "Ajuste automaticamente toda a tabela para manter percentuais ideais de salários dentro do range",
          isNew: true
        },
        {
          icon: Shield,
          title: "Dashboard de Riscos Trabalhistas",
          description: "Fusão entre remuneração e compliance jurídico — diferencial único no mercado",
          isNew: false
        },
        {
          icon: Calculator,
          title: "Gestão de Orçamento de Pessoas",
          description: "Planejamento completo de headcount, custos e projeções orçamentárias por área",
          isNew: true
        }
      ]
    }
  ];

  return (
    <section id="solution" ref={sectionRef} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-primary text-white px-4 py-1.5 mb-6 text-sm">
              <Brain className="h-4 w-4 mr-2" />
              Plataforma Completa
            </Badge>
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

          <div className="space-y-12">
            {solutionCategories.map((cat, catIndex) => (
              <div key={cat.category}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <Badge className={`${cat.categoryBg} ${cat.categoryColor} border-0 px-3 py-1`}>
                    {cat.category}
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Solutions Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cat.solutions.map((solution, index) => (
                    <Card 
                      key={index} 
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `opacity 0.5s ease-out ${(catIndex * 0.2) + (index * 0.1)}s, transform 0.5s ease-out ${(catIndex * 0.2) + (index * 0.1)}s`
                      }}
                      className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20 group relative overflow-hidden"
                    >
                      {/* Hover gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <CardHeader className="relative">
                        <div className="flex items-start justify-between">
                          <div className="p-3 bg-gradient-primary rounded-xl w-fit mb-2 group-hover:scale-110 transition-transform">
                            <solution.icon className="h-6 w-6 text-white" />
                          </div>
                          {solution.isNew && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Novo!
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{solution.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="relative">
                        <CardDescription className="text-sm leading-relaxed">
                          {solution.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
