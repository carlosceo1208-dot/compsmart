import { ArrowRight, BarChart3, Database, FileText, Settings, TrendingUp } from "lucide-react";

export const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      icon: FileText,
      title: "Cadastre sua Empresa",
      description: "Configure a estrutura organizacional e cadastre cargos e colaboradores"
    },
    {
      number: "02",
      icon: Database,
      title: "Importe Dados Atuais",
      description: "Carregue salários, benefícios e informações existentes do seu RH"
    },
    {
      number: "03",
      icon: BarChart3,
      title: "Análises com IA",
      description: "Receba recomendações automáticas baseadas em benchmark de mercado"
    },
    {
      number: "04",
      icon: Settings,
      title: "Ajuste Políticas",
      description: "Configure faixas salariais, benefícios, PLR e programas de incentivo"
    },
    {
      number: "05",
      icon: TrendingUp,
      title: "Monitore e Otimize",
      description: "Acompanhe KPIs e tendências por dashboards inteligentes"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Como{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                funciona
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Configure sua gestão de remuneração em 5 passos simples e comece a tomar decisões estratégicas
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line - Desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -translate-y-1/2" />

            <div className="grid lg:grid-cols-5 gap-8 lg:gap-4 relative">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Step Card */}
                  <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 relative z-10 h-full flex flex-col">
                    {/* Number Badge */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 mt-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>

                    {/* Content */}
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow - Mobile */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center my-4">
                      <ArrowRight className="h-6 w-6 text-primary rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              ⚡ Setup completo em menos de <strong>5 minutos</strong> • 📊 Dashboard pronto para uso imediato
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
