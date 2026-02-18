import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader2, Rocket, TrendingUp, Building2, Crown, LucideIcon, Zap, Brain, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { planFeatures, PlanFeature } from "@/config/planFeatures";
import { DiscountCalculator } from "./DiscountCalculator";

interface ColorClasses {
  gradient: string;
  border: string;
  borderHover: string;
  iconBg: string;
  iconColor: string;
  priceColor: string;
  checkColor: string;
  button: string;
  shadow: string;
}

interface PlanConfig {
  name: string;
  description: string;
  cta: string;
  highlighted: boolean;
  badge?: string;
  icon: LucideIcon;
  colorClasses: ColorClasses;
  employeeLimit: string;
}

const planConfigs: Record<string, PlanConfig> = {
  "Starter": {
    name: "Starter",
    description: "Ideal para pequenas empresas começando a organizar remuneração",
    employeeLimit: "Até 50 colaboradores",
    cta: "Começar Grátis",
    highlighted: false,
    icon: Rocket,
    colorClasses: {
      gradient: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
      border: 'border-green-400',
      borderHover: 'hover:border-green-300',
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      iconColor: 'text-green-600 dark:text-green-400',
      priceColor: 'text-green-600 dark:text-green-400',
      checkColor: 'text-green-500',
      button: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white',
      shadow: 'hover:shadow-[0_20px_50px_-12px_rgba(34,197,94,0.25)]'
    }
  },
  "Medium": {
    name: "Medium",
    description: "Para empresas que querem crescer com inteligência e compliance",
    employeeLimit: "Até 200 colaboradores",
    badge: "Mais Popular",
    cta: "Começar Teste Grátis",
    highlighted: true,
    icon: TrendingUp,
    colorClasses: {
      gradient: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
      border: 'border-violet-500',
      borderHover: 'hover:border-violet-300',
      iconBg: 'bg-violet-100 dark:bg-violet-900/50',
      iconColor: 'text-violet-600 dark:text-violet-400',
      priceColor: 'text-violet-600 dark:text-violet-400',
      checkColor: 'text-violet-500',
      button: 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white',
      shadow: 'hover:shadow-[0_20px_50px_-12px_rgba(139,92,246,0.35)]'
    }
  },
  "Pro": {
    name: "Pro",
    description: "Solução robusta para empresas em expansão que precisam de tudo",
    employeeLimit: "Até 500 colaboradores",
    cta: "Começar Teste Grátis",
    highlighted: false,
    icon: Building2,
    colorClasses: {
      gradient: 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30',
      border: 'border-blue-400',
      borderHover: 'hover:border-blue-300',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      priceColor: 'text-blue-600 dark:text-blue-400',
      checkColor: 'text-blue-500',
      button: 'bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white',
      shadow: 'hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.25)]'
    }
  },
  "Enterprise": {
    name: "Enterprise",
    description: "Solução completa para grandes empresas e consultorias especializadas",
    employeeLimit: "+500 colaboradores",
    cta: "Falar com Vendas",
    highlighted: false,
    icon: Crown,
    colorClasses: {
      gradient: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30',
      border: 'border-amber-400',
      borderHover: 'hover:border-amber-300',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      priceColor: 'text-amber-600 dark:text-amber-400',
      checkColor: 'text-amber-500',
      button: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white',
      shadow: 'hover:shadow-[0_20px_50px_-12px_rgba(245,158,11,0.25)]'
    }
  }
};

interface PlanData {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: { text: string; tooltip?: string; isNew?: boolean }[];
  cta: string;
  highlighted: boolean;
  badge?: string;
  icon: LucideIcon;
  colorClasses: ColorClasses;
  employeeLimit: string;
}

const ANNUAL_DISCOUNT = 0.10; // 10% para plano anual

// Limites de colaboradores por plano para cálculo de preço/colab
const COLAB_LIMITS: Record<string, number> = {
  "Starter": 50,
  "Medium": 200,
  "Pro": 500,
};

export const PricingSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for stagger animation
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

  // Fallback: se após 500ms ainda não estiver visível, força exibição
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isVisible) setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [isVisible]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, name, monthly_price, annual_price')
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
              cta: "Começar",
              highlighted: false,
              icon: Rocket,
              colorClasses: planConfigs["Starter"].colorClasses,
              employeeLimit: ""
            };

            const features = planFeatures[dbPlan.name] || [];

            return {
              id: dbPlan.id,
              name: config.name,
              monthlyPrice: dbPlan.monthly_price || 0,
              annualPrice: dbPlan.annual_price || 0,
              description: config.description,
              features: features,
              cta: config.cta,
              highlighted: config.highlighted,
              badge: config.badge,
              icon: config.icon,
              colorClasses: config.colorClasses,
              employeeLimit: config.employeeLimit
            };
          });

          const sortedPlans = mappedPlans.sort((a, b) => {
            if (a.name === 'Enterprise') return 1;
            if (b.name === 'Enterprise') return -1;
            return 0;
          });

          setPlans(sortedPlans);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getDisplayPrice = (plan: PlanData) => {
    const isEnterprise = plan.name === "Enterprise" || plan.monthlyPrice === 0;
    if (isEnterprise) return "Sob consulta";

    let price: number;
    if (billingCycle === 'annual') {
      price = plan.annualPrice;
    } else {
      price = plan.monthlyPrice;
    }

    return `R$ ${Math.round(price).toLocaleString('pt-BR')}`;
  };

  const getMonthlyEquivalent = (plan: PlanData) => {
    if (plan.name === "Enterprise" || plan.monthlyPrice === 0 || billingCycle !== 'annual') return null;
    return Math.round(plan.monthlyPrice * (1 - ANNUAL_DISCOUNT) * 100) / 100;
  };

  const getPerColabPrice = (plan: PlanData) => {
    const limit = COLAB_LIMITS[plan.name];
    if (!limit || plan.monthlyPrice === 0) return null;
    const price = plan.monthlyPrice / limit;
    return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getSavingsPercent = (plan: PlanData) => {
    if (plan.monthlyPrice === 0) return 0;
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = monthlyTotal - plan.annualPrice;
    return Math.round((savings / monthlyTotal) * 100);
  };

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
    <TooltipProvider>
      <section id="pricing" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-gradient-primary text-white px-4 py-1.5 mb-6 text-sm">
                <Zap className="h-4 w-4 mr-2" />
                2 ferramentas completas por menos de US$ 1/colaborador
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Planos{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  transparentes. Sem surpresas.
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
                <strong>Desempenho + Remuneração incluídos em todos os planos</strong> — sem custo adicional
              </p>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-8">
                Escolha o plano ideal para o tamanho e necessidades da sua empresa.
              </p>

              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center gap-4">
                <span className={`text-sm font-medium transition-colors duration-200 ${
                  billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  Mensal
                </span>
                
                <button
                  onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                  className={`
                    relative w-14 h-7 rounded-full transition-colors duration-300 ease-out
                    ${billingCycle === 'annual' ? 'bg-primary' : 'bg-muted'}
                  `}
                  aria-label="Alternar ciclo de pagamento"
                >
                  <span className={`
                    absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md
                    transition-transform duration-300 ease-out
                    ${billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'}
                  `} />
                </button>
                
                <span className={`text-sm font-medium transition-colors duration-200 ${
                  billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  Anual
                </span>
                
              </div>

              {/* Calculadora de Desconto Interativa */}
              <div className="max-w-2xl mx-auto">
                <DiscountCalculator 
                  plans={plans
                    .filter(p => p.name !== 'Enterprise' && p.monthlyPrice > 0)
                    .map(p => ({
                      id: p.id,
                      name: p.name,
                      price: p.monthlyPrice
                    }))}
                />
              </div>
            </div>

            <div 
              ref={sectionRef}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8"
            >
              {plans.map((plan, index) => {
                const IconComponent = plan.icon;
                const isEnterprise = plan.name === "Enterprise" || plan.monthlyPrice === 0;
                const savingsPercent = getSavingsPercent(plan);
                const perColabPrice = getPerColabPrice(plan);

                return (
                  <Card 
                    key={plan.id}
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                      transition: `opacity 0.5s ease-out ${index * 0.15}s, transform 0.5s ease-out ${index * 0.15}s`
                    }}
                    className={`
                      relative flex flex-col overflow-visible
                      transition-all duration-300 ease-out
                      hover:scale-[1.02]
                      ${plan.colorClasses.shadow}
                      ${plan.highlighted 
                        ? `border-2 ${plan.colorClasses.border} ${plan.colorClasses.gradient} shadow-2xl scale-105 z-10` 
                        : `border-border ${plan.colorClasses.borderHover} hover:${plan.colorClasses.gradient}`
                      }
                    `}
                  >
                    {/* Icon in top right corner */}
                    <div className={`absolute top-4 right-4 p-2 rounded-full ${plan.colorClasses.iconBg} transition-transform duration-300 hover:scale-110`}>
                      <IconComponent className={`h-5 w-5 ${plan.colorClasses.iconColor}`} />
                    </div>

                    {plan.badge && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <Badge className={`${plan.colorClasses.button} px-4 py-1.5 animate-pulse shadow-lg`}>
                          <Sparkles className="h-3 w-3 mr-1 animate-bounce" />
                          {plan.badge}
                        </Badge>
                      </div>
                    )}

                    {/* Badge Desempenho Incluído - todos os planos */}
                    <div className="absolute -top-3 right-12 z-20">
                      <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-2 py-0.5 text-[10px] shadow-lg">
                        🎁 Desempenho Incluído
                      </Badge>
                    </div>

                    <CardHeader className={plan.highlighted ? 'pt-8' : ''}>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="text-xs min-h-[40px]">
                        {plan.description}
                      </CardDescription>
                      <div className="pt-3">
                        {/* Preço */}
                        <span className={`text-3xl font-bold transition-colors duration-200 ${plan.colorClasses.priceColor}`}>
                          {getDisplayPrice(plan)}
                        </span>
                        
                        {!isEnterprise && (
                          <span className="text-muted-foreground text-sm ml-1">
                            {billingCycle === 'annual' ? '/ano' : '/mês'}
                          </span>
                        )}

                        {/* Equivalente mensal para plano anual */}
                        {billingCycle === 'annual' && !isEnterprise && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Equivalente a R$ {getMonthlyEquivalent(plan)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                          </p>
                        )}

                        {/* Preço por colaborador */}
                        {perColabPrice && (
                          <div className="mt-2 flex items-center gap-1">
                            <Users className="h-3 w-3 text-primary" />
                            <span className="text-xs font-semibold text-primary">
                              apenas R$ {perColabPrice}/colaborador
                            </span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="flex-grow">
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 group">
                            <Check className={`h-4 w-4 ${plan.colorClasses.checkColor} flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110`} />
                            <div className="flex items-center gap-1.5">
                              {feature.tooltip ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs cursor-help underline decoration-dotted underline-offset-2">
                                      {feature.text}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{feature.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-xs">{feature.text}</span>
                              )}
                              {feature.isNew && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                                  Novo!
                                </Badge>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter>
                      <Button 
                        className={`w-full transition-all duration-200 ${plan.colorClasses.button}`}
                        size="sm"
                        onClick={() => {
                          if (plan.name === "Enterprise") {
                            window.location.href = 'mailto:contato@compsmart.ia.br?subject=CompSmart%20Enterprise%20-%20Solicita%C3%A7%C3%A3o%20de%20Contato';
                          } else {
                            navigate(`/checkout?plan=${plan.id}&cycle=${billingCycle}`);
                          }
                        }}
                      >
                        {plan.cta}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <div className="mt-12 text-center space-y-4">
              {/* Nota sobre AVD integrada */}
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-4 max-w-2xl mx-auto">
                <p className="text-sm font-medium">
                  🎉 <strong>Avaliação de Desempenho integrada em todos os planos</strong> — Remuneração + Desempenho em uma só plataforma, sem custo adicional.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full">
                  <Brain className="h-4 w-4 text-primary" />
                  <span><strong>IA Integrada</strong> em todos os planos pagos</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/5 px-4 py-2 rounded-full">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span><strong>Avaliação 90°, 180°, 360°, PDI, 9Box</strong> incluída</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                💳 Sem compromisso • 🔄 Cancele quando quiser • 🎯 Upgrade ou downgrade a qualquer momento
              </p>
            </div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};
