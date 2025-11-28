import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlanConfig {
  name: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
}

const planConfigs: Record<string, PlanConfig> = {
  "Starter": {
    name: "Starter",
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
  "Growth": {
    name: "Growth",
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
  "Business": {
    name: "Business",
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
  "Enterprise": {
    name: "Enterprise",
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
};

export const PricingSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Array<{
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    cta: string;
    highlighted: boolean;
    badge?: string;
  }>>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, name, monthly_price')
          .eq('is_active', true)
          .eq('is_public', true)
          .order('monthly_price', { ascending: true });

        if (error) {
          console.error('Error fetching plans:', error);
          setLoading(false);
          return;
        }

        if (data) {
          const mappedPlans = data.map(dbPlan => {
            const config = planConfigs[dbPlan.name] || {
              name: dbPlan.name,
              description: "",
              features: [],
              cta: "Começar",
              highlighted: false
            };

            const isEnterprise = dbPlan.name === "Enterprise" || dbPlan.monthly_price === 0;
            const price = isEnterprise 
              ? "Sob consulta" 
              : `R$ ${dbPlan.monthly_price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

            return {
              id: dbPlan.id,
              name: config.name,
              price,
              period: isEnterprise ? "" : "/mês",
              description: config.description,
              features: config.features,
              cta: config.cta,
              highlighted: config.highlighted,
              badge: config.badge
            };
          });

          setPlans(mappedPlans);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <section id="pricing" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

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
                    onClick={() => {
                      if (plan.name === "Enterprise") {
                        window.location.href = 'mailto:vendas@compsmart.com.br?subject=CompSmart Enterprise - Solicitação de Contato';
                      } else {
                        navigate(`/checkout?plan=${plan.id}&cycle=monthly`);
                      }
                    }}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center space-y-4">
            {/* Diferenciais e Integrações */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                🏢 <strong>Ideal para PMEs e Grandes Empresas</strong>
              </span>
              <span className="flex items-center gap-2">
                🧩 <strong>Integração com Google Workspace e outros</strong>
              </span>
              <span className="flex items-center gap-2">
                🔁 <strong>Evolução Contínua do Produto</strong>
              </span>
              <span className="flex items-center gap-2">
                🤝 <strong>Suporte Consultivo</strong>
              </span>
            </div>

            {/* Garantias */}
            <p className="text-sm text-muted-foreground">
              💳 Sem compromisso • 🔄 Cancele quando quiser • 🎯 Upgrade ou downgrade a qualquer momento
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
