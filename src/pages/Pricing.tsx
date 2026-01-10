import { useState, useEffect } from 'react';
import { Check, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { PlanBadge } from '@/components/PlanBadge';
import { DiscountCalculator } from '@/components/landing/DiscountCalculator';

// Configuração do período de lançamento - UTC-3 Brasil
const LAUNCH_END_DATE = new Date('2026-02-22T23:59:59-03:00');
const LAUNCH_DISCOUNT = 0.30; // 30% de desconto
const ANNUAL_DISCOUNT = 0.10; // 10% adicional para anual
const Pricing = () => {
  const { plan } = useFeatureAccess();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLaunchPeriod, setIsLaunchPeriod] = useState(() => new Date() <= LAUNCH_END_DATE);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      basePrice: 299,
      description: 'Ideal para pequenas empresas iniciando a gestão de remuneração',
      features: [
        'Até 50 funcionários',
        '3 tabelas salariais',
        'People Analytics básico',
        'Exportação em PDF',
        'Suporte por email',
      ],
      type: 'starter' as const,
    },
    {
      id: 'medium',
      name: 'Medium',
      basePrice: 899,
      description: 'Perfeito para empresas em crescimento',
      features: [
        'Até 200 funcionários',
        '10 tabelas salariais',
        'Pesquisa Salarial básica',
        'People Analytics completo',
        'Exportação PDF + Excel',
        'Suporte por email e chat',
      ],
      type: 'medium' as const,
      popular: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      basePrice: 1900,
      description: 'Solução completa para empresas que buscam excelência',
      features: [
        'Funcionários ilimitados',
        'Tabelas salariais ilimitadas',
        'Pesquisa Salarial avançada',
        'People Analytics avançado',
        '🎯 Agentes Smart (Jurídico, Salary, R&B)',
        'Exportação completa + API',
        'Suporte prioritário',
      ],
      type: 'pro' as const,
    },
  ];

  const getDisplayPrice = (basePrice: number) => {
    let price: number;
    if (isLaunchPeriod) {
      if (billingCycle === 'annual') {
        price = Math.round(basePrice * (1 - LAUNCH_DISCOUNT) * (1 - ANNUAL_DISCOUNT) * 12);
      } else {
        price = Math.round(basePrice * (1 - LAUNCH_DISCOUNT));
      }
    } else {
      if (billingCycle === 'annual') {
        price = Math.round(basePrice * (1 - ANNUAL_DISCOUNT) * 12);
      } else {
        price = basePrice;
      }
    }
    return `R$ ${price.toLocaleString('pt-BR')}`;
  };

  const getFullPrice = (basePrice: number) => {
    return billingCycle === 'annual' ? basePrice * 12 : basePrice;
  };

  const getMonthlyEquivalent = (basePrice: number) => {
    if (billingCycle !== 'annual') return null;
    if (isLaunchPeriod) {
      return Math.round(basePrice * (1 - LAUNCH_DISCOUNT) * (1 - ANNUAL_DISCOUNT));
    }
    return Math.round(basePrice * (1 - ANNUAL_DISCOUNT));
  };

  const getDiscountBadge = () => {
    if (!isLaunchPeriod) {
      return billingCycle === 'annual' ? '-10%' : null;
    }
    return billingCycle === 'annual' ? '-30% +10%' : '-30%';
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Escolha o plano ideal para sua empresa
          </h1>
          <p className="text-xl text-muted-foreground">
            Transparência e flexibilidade para crescer junto com você
          </p>
        </div>

        {/* Toggle Mensal/Anual */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anual
              {isLaunchPeriod && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  +10% off
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Contador Regressivo - Período de Lançamento */}
        {isLaunchPeriod && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 border border-primary/20 rounded-xl">
              <Timer className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">Oferta de lançamento expira em:</span>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-primary">{timeRemaining.days}</span>
                  <span className="text-xs text-muted-foreground">dias</span>
                </div>
                <span className="text-primary font-bold">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-primary">{String(timeRemaining.hours).padStart(2, '0')}</span>
                  <span className="text-xs text-muted-foreground">hrs</span>
                </div>
                <span className="text-primary font-bold">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-primary">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
                <span className="text-primary font-bold">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-primary">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                  <span className="text-xs text-muted-foreground">seg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calculadora de Desconto Interativa */}
        <div className="max-w-2xl mx-auto mb-8">
          <DiscountCalculator 
            isLaunchPeriod={isLaunchPeriod}
            plans={plans.map(p => ({
              id: p.id,
              name: p.name,
              price: p.basePrice
            }))}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {plans.map((planItem) => (
            <Card
              key={planItem.type}
              className={`relative ${
                planItem.popular
                  ? 'border-primary shadow-lg scale-105'
                  : ''
              }`}
            >
              {planItem.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <PlanBadge plan="medium" />
                </div>
              )}
              
              {/* Badge de Lançamento */}
              {isLaunchPeriod && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                    🚀 Lançamento
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">{planItem.name}</CardTitle>
                  {plan === planItem.type && (
                    <PlanBadge plan={plan} />
                  )}
                </div>
                
                {/* Preços */}
                <div className="mb-2 space-y-1">
                  {isLaunchPeriod && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-muted-foreground line-through">
                        R$ {getFullPrice(planItem.basePrice).toLocaleString('pt-BR')}
                      </span>
                      {getDiscountBadge() && (
                        <Badge variant="destructive" className="text-xs">
                          {getDiscountBadge()}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div>
                    <span className="text-4xl font-bold">{getDisplayPrice(planItem.basePrice)}</span>
                    <span className="text-muted-foreground">
                      /{billingCycle === 'annual' ? 'ano' : 'mês'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-muted-foreground">
                      Equivalente a R$ {getMonthlyEquivalent(planItem.basePrice)?.toLocaleString('pt-BR')}/mês
                    </p>
                  )}
                  {isLaunchPeriod && (
                    <p className="text-xs text-primary font-medium">
                      Desconto válido até 22/02/2026
                    </p>
                  )}
                </div>
                
                <CardDescription>{planItem.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {planItem.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan === planItem.type ? 'outline' : 'default'}
                  disabled={plan === planItem.type}
                  onClick={() => navigate(`/checkout?plan=${planItem.id}&cycle=${billingCycle}`)}
                >
                  {plan === planItem.type ? 'Plano Atual' : 'Começar Agora'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Todos os planos incluem atualizações gratuitas e segurança de dados.</p>
          <p className="mt-2">
            Precisa de um plano personalizado?{' '}
            <a href="mailto:contato@compsmart.ia.br" className="text-primary hover:underline">
              Entre em contato conosco
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
