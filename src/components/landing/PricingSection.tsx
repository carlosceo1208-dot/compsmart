import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader2, Rocket, TrendingUp, Building2, Crown, LucideIcon, Zap, Brain, Shield, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { planFeatures, PlanFeature } from "@/config/planFeatures";

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
    employeeLimit: "Até 50 funcionários",
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
    employeeLimit: "Até 200 funcionários",
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
    employeeLimit: "Até 500 funcionários",
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
    employeeLimit: "+500 funcionários",
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

// Configuração do período de lançamento - UTC-3 Brasil
const LAUNCH_END_DATE = new Date('2026-02-06T23:59:59-03:00');
const LAUNCH_DISCOUNT = 0.30; // 30% de desconto
const ANNUAL_DISCOUNT = 0.10; // 10% adicional para anual

export const PricingSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isLaunchPeriod, setIsLaunchPeriod] = useState(() => new Date() <= LAUNCH_END_DATE);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

  // Contador regressivo - atualiza a cada segundo
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const diff = LAUNCH_END_DATE.getTime() - now.getTime();
      
      if (diff <= 0) {
        setIsLaunchPeriod(false);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      };
    };
    
    setTimeRemaining(calculateTimeRemaining());
    const interval = setInterval(() => setTimeRemaining(calculateTimeRemaining()), 1000);
    return () => clearInterval(interval);
  }, []);

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

            // Usar features do config centralizado
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

          // Sort: Enterprise always at the end
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
    const baseMonthly = plan.monthlyPrice;

    if (isLaunchPeriod) {
      if (billingCycle === 'annual') {
        // Lançamento Anual: 30% + 10% = preço × 0.70 × 0.90 × 12
        price = Math.round(baseMonthly * (1 - LAUNCH_DISCOUNT) * (1 - ANNUAL_DISCOUNT) * 12);
      } else {
        // Lançamento Mensal: 30% de desconto
        price = Math.round(baseMonthly * (1 - LAUNCH_DISCOUNT));
      }
    } else {
      if (billingCycle === 'annual') {
        // Pós-lançamento Anual: usa annual_price do banco (já com 10% desc)
        price = plan.annualPrice;
      } else {
        // Pós-lançamento Mensal: preço cheio
        price = baseMonthly;
      }
    }

    return `R$ ${Math.round(price).toLocaleString('pt-BR')}`;
  };

  // Preço cheio (para exibir riscado durante lançamento)
  const getFullPrice = (plan: PlanData) => {
    if (plan.name === "Enterprise" || plan.monthlyPrice === 0) return null;
    return billingCycle === 'annual' ? plan.monthlyPrice * 12 : plan.monthlyPrice;
  };

  // Equivalente mensal no plano anual
  const getMonthlyEquivalent = (plan: PlanData) => {
    if (plan.name === "Enterprise" || plan.monthlyPrice === 0 || billingCycle !== 'annual') return null;
    const base = plan.monthlyPrice;
    if (isLaunchPeriod) {
      return Math.round(base * (1 - LAUNCH_DISCOUNT) * (1 - ANNUAL_DISCOUNT) * 100) / 100;
    }
    return Math.round(base * (1 - ANNUAL_DISCOUNT) * 100) / 100;
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
                Preços Atualizados 2026
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Planos{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  transparentes
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Escolha o plano ideal para o tamanho e necessidades da sua empresa. Sem custos ocultos.
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

              {/* Contador Regressivo - Oferta de Lançamento */}
              {isLaunchPeriod && (
                <div className="mt-8 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl max-w-xl mx-auto">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-orange-500 animate-pulse" />
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        Oferta de Lançamento termina em:
                      </span>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <div className="flex flex-col items-center bg-background/80 backdrop-blur px-3 sm:px-4 py-2 rounded-lg shadow border border-orange-200 dark:border-orange-800">
                        <span className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{String(timeRemaining.days).padStart(2, '0')}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">dias</span>
                      </div>
                      <div className="flex flex-col items-center bg-background/80 backdrop-blur px-3 sm:px-4 py-2 rounded-lg shadow border border-orange-200 dark:border-orange-800">
                        <span className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{String(timeRemaining.hours).padStart(2, '0')}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">horas</span>
                      </div>
                      <div className="flex flex-col items-center bg-background/80 backdrop-blur px-3 sm:px-4 py-2 rounded-lg shadow border border-orange-200 dark:border-orange-800">
                        <span className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">min</span>
                      </div>
                      <div className="flex flex-col items-center bg-background/80 backdrop-blur px-3 sm:px-4 py-2 rounded-lg shadow border border-orange-200 dark:border-orange-800">
                        <span className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">seg</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div 
              ref={sectionRef}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8"
            >
              {plans.map((plan, index) => {
                const IconComponent = plan.icon;
                const isEnterprise = plan.name === "Enterprise" || plan.monthlyPrice === 0;
                const savingsPercent = getSavingsPercent(plan);

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

                    {/* Badge Lançamento 2026 */}
                    {isLaunchPeriod && !isEnterprise && (
                      <div className="absolute -top-3 right-12 z-20">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-0.5 text-[10px] shadow-lg animate-pulse">
                          🚀 Lançamento
                        </Badge>
                      </div>
                    )}

                    <CardHeader className={plan.highlighted ? 'pt-8' : ''}>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="text-xs min-h-[40px]">
                        {plan.description}
                      </CardDescription>
                      <div className="pt-3">
                        {/* Preço cheio riscado durante lançamento */}
                        {isLaunchPeriod && !isEnterprise && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-muted-foreground line-through">
                              R$ {getFullPrice(plan)?.toLocaleString('pt-BR')}
                            </span>
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-xs">
                              -{Math.round(LAUNCH_DISCOUNT * 100)}%{billingCycle === 'annual' ? ' +10%' : ''}
                            </Badge>
                          </div>
                        )}

                        {/* Preço com desconto em destaque */}
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

                        {/* Texto de validade do lançamento */}
                        {isLaunchPeriod && !isEnterprise && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                            Desconto válido até 06/02/2026
                          </p>
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
              {/* Feature highlights */}
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full">
                  <Brain className="h-4 w-4 text-primary" />
                  <span><strong>IA Integrada</strong> em todos os planos pagos</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/5 px-4 py-2 rounded-full">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span><strong>LGPD Compliant</strong></span>
                </div>
              </div>

              {/* Diferenciais e Integrações */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  🏢 <strong>Ideal para PMEs e Grandes Empresas</strong>
                </span>
                <span className="flex items-center gap-2">
                  🧩 <strong>Integração com Google Workspace</strong>
                </span>
                <span className="flex items-center gap-2">
                  🔁 <strong>Evolução Contínua</strong>
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
    </TooltipProvider>
  );
};
