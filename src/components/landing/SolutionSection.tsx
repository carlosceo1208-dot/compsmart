import { BarChart3, Database, FileText, TrendingUp, Users, Calculator, Brain, Award, Target, Briefcase, PieChart, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const pillars = [
    {
      id: "strategic",
      label: "Remuneração Estratégica",
      icon: Briefcase,
      color: "text-green-600",
      bg: "bg-green-500/10",
      solutions: [
        {
          icon: BarChart3,
          title: "Tabelas Salariais",
          description: "Crie e gerencie grades, níveis e faixas salariais com pontos médios e amplitudes automáticas"
        },
        {
          icon: Calculator,
          title: "Avaliação de Cargos por Pontos",
          description: "Avaliação de cargos por fatores e pontos — alinhada às melhores metodologias de mercado"
        },
        {
          icon: Database,
          title: "Pesquisas de Mercado (Surveys)",
          description: "Compare sua remuneração com dados reais do mercado e receba recomendações inteligentes"
        }
      ]
    },
    {
      id: "performance",
      label: "Avaliação de Desempenho",
      icon: Target,
      color: "text-orange-600",
      bg: "bg-orange-500/10",
      solutions: [
        {
          icon: Users,
          title: "Avaliação 360°",
          description: "Ciclos de avaliação 90°, 180° e 360° com feedback estruturado e devolutivas com IA"
        },
        {
          icon: Award,
          title: "Matriz 9Box & PDI",
          description: "Classificação automática de performance × potencial com planos de desenvolvimento individual"
        },
        {
          icon: TrendingUp,
          title: "Plano de Sucessão",
          description: "Mapeamento de sucessores por posição-chave com análise de prontidão e gaps"
        }
      ]
    },
    {
      id: "planning",
      label: "Planejamento Inteligente",
      icon: PieChart,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      solutions: [
        {
          icon: Calculator,
          title: "Orçamento de Headcount",
          description: "Planejamento completo de contratações, promoções e movimentações com impacto orçamentário"
        },
        {
          icon: BarChart3,
          title: "Projeções Fiscais Anuais",
          description: "Previsão de custo de folha para 12-36 meses com projeções automáticas de crescimento"
        },
        {
          icon: Target,
          title: "Gestão de Custos de Pessoas",
          description: "Controle total sobre encargos, benefícios e custos variáveis por área e centro de custo"
        }
      ]
    },
    {
      id: "ai",
      label: "Inteligência Artificial",
      icon: Brain,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      solutions: [
        {
          icon: FileText,
          title: "Análise de Documentos",
          description: "Upload de acordos coletivos, políticas e contratos para extração automática de informações"
        },
        {
          icon: Bot,
          title: "Agentes Smart",
          description: "Assistentes especializados: Jurídico, Salary Analysis e R&B para consultas estratégicas"
        },
        {
          icon: Brain,
          title: "Otimização de Incentivos",
          description: "Recomendações inteligentes para programas de ICP, ILP, stock options e previdência"
        }
      ]
    }
  ];

  return (
    <section id="solution" ref={sectionRef} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
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
              Uma plataforma completa organizada em 3 pilares para gestão estratégica de remuneração
            </p>
          </div>

          {/* Tabs for 3 Pillars */}
          <Tabs defaultValue="strategic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 h-auto p-1 bg-muted/50">
              {pillars.map((pillar) => (
                <TabsTrigger 
                  key={pillar.id} 
                  value={pillar.id}
                  className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <pillar.icon className={`h-4 w-4 ${pillar.color}`} />
                  <span className="hidden sm:inline">{pillar.label}</span>
                  <span className="sm:hidden text-xs">{pillar.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {pillars.map((pillar) => (
              <TabsContent key={pillar.id} value={pillar.id} className="mt-0">
                {/* Pillar Header */}
                <div className="flex items-center gap-3 mb-6">
                  <Badge className={`${pillar.bg} ${pillar.color} border-0 px-4 py-1.5`}>
                    <pillar.icon className="h-4 w-4 mr-2" />
                    {pillar.label}
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Solutions Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {pillar.solutions.map((solution, index) => (
                    <Card 
                      key={index}
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `opacity 0.5s ease-out ${index * 0.1}s, transform 0.5s ease-out ${index * 0.1}s`
                      }}
                      className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20 group relative overflow-hidden"
                    >
                      {/* Hover gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <CardHeader className="relative">
                        <div className={`p-3 rounded-xl w-fit mb-2 ${pillar.bg} group-hover:scale-110 transition-transform`}>
                          <solution.icon className={`h-6 w-6 ${pillar.color}`} />
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
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};
