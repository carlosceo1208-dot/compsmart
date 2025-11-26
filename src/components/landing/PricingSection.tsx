import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PricingSection = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Starter",
      price: "R$ 249",
      period: "/mês",
      description: "Ideal para pequenas empresas começando a organizar remuneração",
      features: [
        "Até 50 funcionários",
        "Estrutura básica de cargos",
        "Dashboards essenciais",
        "Suporte por email",
        "2 usuários administradores"
      ],
      cta: "Começar Grátis",
      highlighted: false
    },
    {
      name: "Growth",
      price: "R$ 499",
      period: "/mês",
      description: "Para empresas que querem crescer com inteligência e compliance",
      badge: "Mais Popular",
      features: [
        "Até 250 funcionários",
        "Agentes Inteligentes integrados",
        "Benchmark de mercado",
        "Gestão de PLR e incentivos",
        "Compliance automático",
        "Relatórios avançados",
        "5 usuários",
        "Suporte prioritário"
      ],
      cta: "Começar Teste Grátis",
      highlighted: true
    },
    {
      name: "Business",
      price: "R$ 999",
      period: "/mês",
      description: "Solução robusta para empresas em expansão que precisam de tudo",
      features: [
        "Até 500 funcionários",
        "Tudo do Growth incluído",
        "Análise de equidade interna",
        "Simulações de política salarial",
        "Modelagem preditiva",
        "Dashboard de riscos trabalhistas",
        "Usuários ilimitados",
        "Treinamento online"
      ],
      cta: "Começar Teste Grátis",
      highlighted: false
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      period: "",
      description: "Solução completa para grandes empresas e consultorias especializadas",
      features: [
        "+500 funcionários",
        "Tudo do Business incluído",
        "Consultoria dedicada",
        "Integrações customizadas",
        "API e webhooks",
        "SLA garantido",
        "Treinamento personalizado",
        "Gerente de conta"
      ],
      cta: "Falar com Vendas",
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Planos{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                transparentes
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho e necessidades da sua empresa. Sem custos ocultos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative flex flex-col ${
                  plan.highlighted 
                    ? 'border-2 border-primary shadow-2xl scale-105 z-10' 
                    : 'border-border'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-white px-4 py-1.5">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className={plan.highlighted ? 'pt-8' : ''}>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-xs min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                  <div className="pt-3">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className={`w-full ${
                      plan.highlighted 
                        ? 'bg-gradient-primary hover:opacity-90' 
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                    size="sm"
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              💳 Sem compromisso • 🔄 Cancele quando quiser • 🎯 Upgrade ou downgrade a qualquer momento
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
