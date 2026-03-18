import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Check, ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string;
  plan_type: string;
  monthly_price: number;
  annual_price: number;
  features: any;
  max_employees: number | null;
  max_users: number | null;
}

interface PlanSelectionStepProps {
  selectedPlanId: string | null;
  onUpdate: (planId: string, billingCycle: 'monthly' | 'annual') => void;
  onNext: () => void;
  onBack: () => void;
}

export const PlanSelectionStep = ({ 
  selectedPlanId, 
  onUpdate, 
  onNext, 
  onBack 
}: PlanSelectionStepProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    onUpdate(planId, billingCycle);
  };

  const handleNext = () => {
    if (!selectedPlanId) {
      toast.error('Por favor, selecione um plano');
      return;
    }
    onNext();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getMonthlyEquivalent = (annualPrice: number) => {
    return annualPrice / 12;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Escolha seu Plano</CardTitle>
            <CardDescription>
              Selecione o plano ideal para sua empresa
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingCycle('monthly')}
          >
            Mensal
          </Button>
          <Button
            variant={billingCycle === 'annual' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingCycle('annual')}
          >
            Anual
            <Badge variant="secondary" className="ml-2">
              -17%
            </Badge>
          </Button>
        </div>

        {/* Plans Grid */}
        <RadioGroup value={selectedPlanId || ''} onValueChange={handlePlanSelect}>
          <div className="grid gap-4">
            {plans.map((plan) => {
              const price = billingCycle === 'monthly' 
                ? plan.monthly_price 
                : getMonthlyEquivalent(plan.annual_price);
              
              const isSelected = selectedPlanId === plan.id;
              const isPopular = plan.plan_type === 'pro';

              return (
                <div key={plan.id} className="relative">
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  <div
                    className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={plan.id} id={plan.id} />
                        <div>
                          <Label htmlFor={plan.id} className="text-lg font-bold cursor-pointer">
                            {plan.name}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {plan.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-3xl font-bold">
                          {formatPrice(price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          por mês
                        </div>
                        {billingCycle === 'annual' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatPrice(plan.annual_price)}/ano
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mt-4">
                      {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Limits */}
                    <div className="flex gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                      {plan.max_employees && (
                        <div>
                          <strong>{plan.max_employees}</strong> colaboradores
                        </div>
                      )}
                      {plan.max_users && (
                        <div>
                          <strong>{plan.max_users}</strong> usuários
                        </div>
                      )}
                      {!plan.max_employees && !plan.max_users && (
                        <div className="text-primary font-semibold">
                          Ilimitado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </RadioGroup>

        {/* Trial Info */}
        <div className="bg-accent/50 border border-accent rounded-lg p-4 text-sm">
          <p className="font-semibold mb-1">🎉 30 dias grátis para teste</p>
          <p className="text-muted-foreground">
            Experimente todos os recursos do plano escolhido sem compromisso. 
            Cancele a qualquer momento durante o período de teste.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedPlanId}
            className="flex-1 gap-2"
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};