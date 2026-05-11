import { useState } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { PlanBadge } from '@/components/PlanBadge';
import { DiscountCalculator } from '@/components/landing/DiscountCalculator';

const ANNUAL_DISCOUNT = 0.10;

const Pricing = () => {
  const { plan } = useFeatureAccess();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

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
        'Avaliação de Desempenho integrada + PerformAI',
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
        'Avaliação completa (90°, 180°, 360°, PDI, 9Box) + PerformAI',
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
        '🎯 Agentes Smart (Jurídico, Salary, R&B, PerformAI)',
        'Avaliação avançada + Reconhecimento + Sucessão',
        'Exportação completa + API',
        'Suporte prioritário',
      ],
      type: 'pro' as const,
    },
  ];

  const getDisplayPrice = (basePrice: number) => {
    let price: number;
    if (billingCycle === 'annual') {
      price = Math.round(basePrice * (1 - ANNUAL_DISCOUNT) * 12);
    } else {
      price = basePrice;
    }
    return `R$ ${price.toLocaleString('pt-BR')}`;
  };

  const getMonthlyEquivalent = (basePrice: number) => {
    if (billingCycle !== 'annual') return null;
    return Math.round(basePrice * (1 - ANNUAL_DISCOUNT));
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Escolha o plano ideal para sua empresa
          </h1>
          <p className="text-xl text-muted-foreground">
            Remuneração + Desempenho integrados em todos os planos
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
              <Badge variant="secondary" className="ml-2 text-xs">
                -10%
              </Badge>
            </button>
          </div>
        </div>

        {/* Calculadora de Desconto Interativa */}
        <div className="max-w-2xl mx-auto mb-8">
          <DiscountCalculator 
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

              {/* Badge Desempenho Incluído */}
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0 text-xs">
                  🎁 Desempenho Incluído
                </Badge>
              </div>

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">{planItem.name}</CardTitle>
                  {plan === planItem.type && (
                    <PlanBadge plan={plan} />
                  )}
                </div>
                
                {/* Preços */}
                <div className="mb-2 space-y-1">
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

        {/* NR-1 Add-on Section */}
        <div className="max-w-5xl mx-auto mt-4 mb-8">
          <Card className="border-2 border-dashed">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">🛡️ Add-on NR-1 — Saúde, Bem-Estar & Performance</CardTitle>
                <Badge className="bg-red-100 text-red-700 border-red-200">Obrigatório 2026</Badge>
              </div>
              <CardDescription>
                Conformidade com a NR-1 (riscos psicossociais). <strong>Já incluso no plano Pro e Enterprise.</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Até 100 colab.</p>
                  <p className="text-2xl font-bold">R$ 349<span className="text-sm text-muted-foreground">/mês</span></p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">101 a 500</p>
                  <p className="text-2xl font-bold">R$ 649<span className="text-sm text-muted-foreground">/mês</span></p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">501+ colab.</p>
                  <p className="text-2xl font-bold">R$ 1.190<span className="text-sm text-muted-foreground">/mês</span></p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Button variant="outline" asChild>
                  <a href="/nr1-publico">Saber mais sobre NR-1</a>
                </Button>
                <Button onClick={() => navigate('/checkout?plan=nr1_essencial&cycle=monthly')}>
                  Contratar NR-1 Essencial
                </Button>
              </div>
            </CardContent>
          </Card>
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