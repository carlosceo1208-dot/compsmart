import { AlertCircle, FileSpreadsheet, Scale, TrendingDown, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

export const PainPointsSection = () => {
  const pains = [
    {
      icon: Scale,
      title: "Salários Defasados",
      description: "Sem critérios claros e falta de benchmark de mercado para ajustes justos"
    },
    {
      icon: FileSpreadsheet,
      title: "Processos Manuais",
      description: "Planilhas desconectadas sem inteligência para gestão de benefícios e PLR"
    },
    {
      icon: AlertCircle,
      title: "Riscos Trabalhistas",
      description: "Falta de compliance e insegurança jurídica em relação à legislação"
    },
    {
      icon: TrendingDown,
      title: "Dificuldade em Reter",
      description: "Perda de talentos estratégicos por política de remuneração inadequada"
    },
    {
      icon: Users,
      title: "Falta de Transparência",
      description: "Ausência de clareza interna sobre estrutura e critérios de remuneração"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Ainda improvisa na{" "}
              <span className="text-destructive">gestão de remuneração?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Empresas líderes exigem mais que planilhas. Com a CompSmart, você e a inteligência artificial orquestram no detalhe toda a gestão de Cargos, Salários, Benefícios, Programas de Incentivos e outros, garantindo a atração e retenção dos melhores talentos com total equidade. Transforme sua remuneração em uma vantagem estratégica decisiva para o seu negócio.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pains.map((pain, index) => (
              <Card 
                key={index} 
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-background/80 backdrop-blur-sm"
              >
                <div className="flex flex-col items-start gap-4">
                  <div className="p-3 bg-destructive/10 rounded-xl">
                    <pain.icon className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{pain.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pain.description}
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
