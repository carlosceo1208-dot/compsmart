import { AlertCircle, FileSpreadsheet, Scale, TrendingDown, Users, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";

export const PainPointsSection = () => {
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

  const pains = [
    {
      icon: Scale,
      title: "Salários Defasados",
      description: "Sem critérios claros e falta de benchmark de mercado para ajustes justos",
      stat: "68%",
      statLabel: "dos colaboradores pedem demissão por salários defasados"
    },
    {
      icon: FileSpreadsheet,
      title: "Processos Manuais",
      description: "Planilhas desconectadas sem inteligência para gestão de benefícios e PLR",
      stat: "40h",
      statLabel: "gastas por mês em processos manuais"
    },
    {
      icon: AlertCircle,
      title: "Riscos Trabalhistas",
      description: "Falta de compliance e insegurança jurídica em relação à legislação",
      stat: "R$ 500k",
      statLabel: "custo médio de uma ação trabalhista"
    },
    {
      icon: TrendingDown,
      title: "Dificuldade em Reter",
      description: "Perda de talentos estratégicos por política de remuneração inadequada",
      stat: "2.5x",
      statLabel: "custo de substituir um colaborador"
    },
    {
      icon: Users,
      title: "Falta de Transparência",
      description: "Ausência de clareza interna sobre estrutura e critérios de remuneração",
      stat: "73%",
      statLabel: "querem entender sua estrutura salarial"
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-muted/30 dark:bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 px-4 py-1.5 mb-6">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Problemas Comuns
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Ainda improvisa na{" "}
              <span className="text-destructive">gestão de remuneração?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Empresas líderes exigem mais que planilhas. Com a CompSmart, você e a inteligência artificial orquestram no detalhe toda a gestão de Cargos, Salários, Benefícios, Programas de Incentivos e outros, garantindo a atração e retenção dos melhores talentos com total equidade. <strong>Transforme sua remuneração em uma vantagem estratégica decisiva para o seu negócio.</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pains.map((pain, index) => (
              <Card 
                key={index} 
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ease-out ${index * 0.1}s, transform 0.5s ease-out ${index * 0.1}s`
                }}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-background/80 dark:bg-background/60 backdrop-blur-sm border-destructive/10 hover:border-destructive/30 group"
              >
                <div className="flex flex-col items-start gap-4">
                  <div className="p-3 bg-destructive/10 rounded-xl group-hover:bg-destructive/20 transition-colors">
                    <pain.icon className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{pain.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pain.description}
                    </p>
                  </div>
                  
                  {/* Stat highlight */}
                  <div className="pt-2 border-t border-border/50 w-full">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-destructive">{pain.stat}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{pain.statLabel}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA dentro da seção */}
          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground">
              💡 <strong>Não deixe esses problemas afetarem seu negócio.</strong> A CompSmart resolve tudo isso com IA.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
