import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { PlanBadge } from '@/components/PlanBadge';

const Pricing = () => {
  const { plan } = useFeatureAccess();

  const plans = [
    {
      name: 'Starter',
      price: 'R$ 199',
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
      name: 'Medium',
      price: 'R$ 499',
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
      name: 'Pro',
      price: 'R$ 997',
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Escolha o plano ideal para sua empresa
          </h1>
          <p className="text-xl text-muted-foreground">
            Transparência e flexibilidade para crescer junto com você
          </p>
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
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">{planItem.name}</CardTitle>
                  {plan === planItem.type && (
                    <PlanBadge plan={plan} />
                  )}
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-bold">{planItem.price}</span>
                  <span className="text-muted-foreground">/mês</span>
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
                >
                  {plan === planItem.type ? 'Plano Atual' : 'Começar Agora'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Todos os planos incluem atualizações gratuitas e segurança de dados.</p>
          <p className="mt-2">Precisa de um plano personalizado? Entre em contato conosco.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
