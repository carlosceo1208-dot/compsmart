import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, Rocket, TrendingUp, Building2, Check, ArrowRight, 
  Users, Calendar, CreditCard, AlertCircle, Loader2, Star
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  plan_type: string;
  monthly_price: number;
  annual_price: number;
  max_employees: number | null;
  max_users: number | null;
  features: string[];
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
}

interface CompanySubscription {
  id: string;
  status: string;
  billing_cycle: string;
  started_at: string;
  next_billing_date: string | null;
  plan: SubscriptionPlan;
}

const planIcons: Record<string, React.ElementType> = {
  starter: Rocket,
  growth: TrendingUp,
  business: Building2,
  enterprise: Crown,
};

const planColors: Record<string, { bg: string; border: string; text: string }> = {
  starter: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-600' },
  growth: { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-600' },
  business: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600' },
  enterprise: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600' },
};

export default function MyPlan() {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompanyContext();
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<CompanySubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (activeCompanyId) {
      fetchData();
    }
  }, [activeCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar assinatura atual da empresa
      const { data: subscription } = await supabase
        .from('company_subscriptions')
        .select(`
          id,
          status,
          billing_cycle,
          started_at,
          next_billing_date,
          plan:subscription_plans(*)
        `)
        .eq('company_id', activeCompanyId)
        .eq('status', 'active')
        .single();

      if (subscription && subscription.plan) {
        const planData = subscription.plan as unknown as SubscriptionPlan;
        setCurrentSubscription({
          ...subscription,
          plan: {
            ...planData,
            features: Array.isArray(planData.features) ? planData.features : []
          }
        });
      }

      // Buscar todos os planos públicos e ativos
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('sort_order', { ascending: true });

      if (plans) {
        setAvailablePlans(plans.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? p.features as string[] : []
        })));
      }

      // Contar funcionários da empresa
      const { count: empCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('root_company_id', activeCompanyId)
        .eq('status', 'active')
        .not('employee_number', 'is', null);

      setEmployeeCount(empCount || 0);

      // Contar usuários com acesso ao sistema
      const { count: usrCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('root_company_id', activeCompanyId)
        .eq('has_system_access', true);

      setUserCount(usrCount || 0);

    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    navigate(`/checkout?plan=${planId}&cycle=monthly`);
  };

  const handleContact = () => {
    window.location.href = 'mailto:comercial@compsmart.com.br?subject=Interesse no Plano Enterprise';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando informações do plano...</p>
        </div>
      </div>
    );
  }

  const currentPlan = currentSubscription?.plan;
  const maxEmployees = currentPlan?.max_employees || 0;
  const employeeUsagePercent = maxEmployees > 0 ? Math.min((employeeCount / maxEmployees) * 100, 100) : 0;
  const isNearLimit = employeeUsagePercent >= 80;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Meu Plano</h1>
        <p className="text-muted-foreground mt-1">
          Visualize e gerencie sua assinatura
        </p>
      </div>

      {/* Alert se próximo do limite */}
      {isNearLimit && currentPlan && (
        <Alert className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Você está utilizando {employeeUsagePercent.toFixed(0)}% do limite de funcionários do seu plano.
            Considere fazer upgrade para continuar crescendo.
          </AlertDescription>
        </Alert>
      )}

      {/* Plano Atual */}
      {currentPlan ? (
        <Card className={`${planColors[currentPlan.plan_type]?.bg} ${planColors[currentPlan.plan_type]?.border} border-2`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = planIcons[currentPlan.plan_type] || Crown;
                  return <Icon className={`h-8 w-8 ${planColors[currentPlan.plan_type]?.text}`} />;
                })()}
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {currentPlan.name}
                    <Badge className="bg-emerald-500">Ativo</Badge>
                  </CardTitle>
                  <CardDescription>{currentPlan.description}</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {formatCurrency(currentSubscription.billing_cycle === 'annual' 
                    ? currentPlan.annual_price / 12 
                    : currentPlan.monthly_price)}
                </p>
                <p className="text-sm text-muted-foreground">
                  /mês ({currentSubscription.billing_cycle === 'annual' ? 'plano anual' : 'plano mensal'})
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Uso do Plano */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Funcionários
                  </span>
                  <span className="font-medium">
                    {employeeCount} / {maxEmployees > 0 ? maxEmployees : 'Ilimitado'}
                  </span>
                </div>
                {maxEmployees > 0 && (
                  <Progress value={employeeUsagePercent} className="h-2" />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Início: {new Date(currentSubscription.started_at).toLocaleDateString('pt-BR')}</span>
                </div>
                {currentSubscription.next_billing_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4" />
                    <span>Próxima cobrança: {new Date(currentSubscription.next_billing_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Recursos Incluídos */}
            <div>
              <p className="font-medium mb-3">Recursos Incluídos:</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {currentPlan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className={`h-4 w-4 ${planColors[currentPlan.plan_type]?.text}`} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você ainda não possui uma assinatura ativa. Escolha um plano abaixo para começar.
          </AlertDescription>
        </Alert>
      )}

      {/* Add-ons opcionais (independentes do plano) */}
      {activeCompanyId && <AddonsManager companyId={activeCompanyId} canEdit />}

      {/* Comparar Planos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {currentPlan ? 'Alterar Plano' : 'Escolha seu Plano'}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {availablePlans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const Icon = planIcons[plan.plan_type] || Crown;
            const colors = planColors[plan.plan_type] || planColors.starter;
            const isEnterprise = plan.plan_type === 'enterprise';

            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all ${
                  isCurrentPlan 
                    ? `${colors.border} border-2 ${colors.bg}` 
                    : 'hover:shadow-md hover:scale-[1.02]'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500">
                      <Star className="h-3 w-3 mr-1" />
                      Plano Atual
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto p-3 rounded-full ${colors.bg} w-fit`}>
                    <Icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {formatCurrency(plan.monthly_price)}
                    </p>
                    <p className="text-xs text-muted-foreground">/mês</p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground">
                    {plan.max_employees ? `Até ${plan.max_employees} funcionários` : 'Funcionários ilimitados'}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    {plan.features.slice(0, 4).map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${colors.text}`} />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{plan.features.length - 4} recursos
                      </p>
                    )}
                  </div>
                  
                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      Plano Atual
                    </Button>
                  ) : isEnterprise ? (
                    <Button className="w-full" variant="outline" onClick={handleContact}>
                      Falar com Vendas
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {currentPlan && plan.monthly_price > currentPlan.monthly_price ? 'Fazer Upgrade' : 'Selecionar'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Link para Faturamento */}
      <Card className="bg-muted/30">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">Histórico de Faturas e Pagamentos</p>
            <p className="text-sm text-muted-foreground">
              Visualize suas faturas anteriores e gerencie métodos de pagamento
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/settings/billing')}>
            <CreditCard className="mr-2 h-4 w-4" />
            Ver Faturamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
