import { useState, useMemo } from 'react';
import { Calculator, Percent, Calendar, CreditCard, Banknote, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface DiscountCalculatorProps {
  isLaunchPeriod: boolean;
  plans: Plan[];
}

const LAUNCH_DISCOUNT = 0.30;
const ANNUAL_DISCOUNT = 0.10;
const PIX_DISCOUNT = 0.05;

export const DiscountCalculator = ({ isLaunchPeriod, plans }: DiscountCalculatorProps) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>(plans[1]?.id || plans[0]?.id || '');
  const [launchDiscount, setLaunchDiscount] = useState(isLaunchPeriod);
  const [annualDiscount, setAnnualDiscount] = useState(true);
  const [pixDiscount, setPixDiscount] = useState(false);

  const selectedPlanData = useMemo(() => 
    plans.find(p => p.id === selectedPlan) || plans[0],
    [plans, selectedPlan]
  );

  const calculation = useMemo(() => {
    if (!selectedPlanData) return null;

    const baseMonthly = selectedPlanData.price;
    const months = annualDiscount ? 12 : 1;
    let totalPrice = baseMonthly * months;
    const originalPrice = totalPrice;

    const discounts: { name: string; percent: number; value: number }[] = [];

    // Aplicar descontos multiplicativamente
    if (launchDiscount && isLaunchPeriod) {
      const discountValue = totalPrice * LAUNCH_DISCOUNT;
      discounts.push({ name: 'Desconto de Lançamento (30%)', percent: 30, value: discountValue });
      totalPrice *= (1 - LAUNCH_DISCOUNT);
    }

    if (annualDiscount) {
      const discountValue = totalPrice * ANNUAL_DISCOUNT;
      discounts.push({ name: 'Plano Anual (10%)', percent: 10, value: discountValue });
      totalPrice *= (1 - ANNUAL_DISCOUNT);
    }

    if (pixDiscount) {
      const discountValue = totalPrice * PIX_DISCOUNT;
      discounts.push({ name: 'Pagamento via PIX (5%)', percent: 5, value: discountValue });
      totalPrice *= (1 - PIX_DISCOUNT);
    }

    const totalSavings = originalPrice - totalPrice;
    const totalDiscountPercent = ((totalSavings / originalPrice) * 100);
    const monthlyEquivalent = annualDiscount ? totalPrice / 12 : totalPrice;

    return {
      originalPrice,
      finalPrice: Math.round(totalPrice),
      discounts,
      totalSavings: Math.round(totalSavings),
      totalDiscountPercent,
      monthlyEquivalent: Math.round(monthlyEquivalent),
      period: annualDiscount ? 'ano' : 'mês'
    };
  }, [selectedPlanData, launchDiscount, annualDiscount, pixDiscount, isLaunchPeriod]);

  if (!calculation || plans.length === 0) return null;

  const hasMaxDiscount = launchDiscount && isLaunchPeriod && annualDiscount && pixDiscount;

  return (
    <TooltipProvider>
      <Card className="mt-8 mb-4 border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            Simule seu Desconto
            {hasMaxDiscount && (
              <Badge className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 animate-pulse">
                <Sparkles className="h-3 w-3 mr-1" />
                Máximo!
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Plano */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Escolha o plano base:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200 text-center
                    ${selectedPlan === plan.id
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <span className="font-semibold text-sm">{plan.name}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    R$ {plan.price.toLocaleString('pt-BR')}/mês
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes de Desconto */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Selecione os descontos aplicáveis:
            </label>
            
            <div className="space-y-2">
              {/* Desconto de Lançamento */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`
                      flex items-center justify-between p-3 rounded-lg border transition-all
                      ${!isLaunchPeriod 
                        ? 'bg-muted/50 border-muted cursor-not-allowed opacity-60' 
                        : launchDiscount 
                          ? 'bg-orange-500/10 border-orange-500/30' 
                          : 'border-border hover:border-primary/30'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id="launch"
                        checked={launchDiscount && isLaunchPeriod}
                        onCheckedChange={(checked) => setLaunchDiscount(!!checked)}
                        disabled={!isLaunchPeriod}
                      />
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-orange-500" />
                        <label htmlFor="launch" className="text-sm font-medium cursor-pointer">
                          30% Desconto de Lançamento
                          {isLaunchPeriod && (
                            <span className="text-xs text-muted-foreground ml-1">(até 22/02/2026)</span>
                          )}
                        </label>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      -30%
                    </Badge>
                  </div>
                </TooltipTrigger>
                {!isLaunchPeriod && (
                  <TooltipContent>
                    <p>Promoção de lançamento encerrada</p>
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Desconto Anual */}
              <div 
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-all
                  ${annualDiscount 
                    ? 'bg-violet-500/10 border-violet-500/30' 
                    : 'border-border hover:border-primary/30'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="annual"
                    checked={annualDiscount}
                    onCheckedChange={(checked) => setAnnualDiscount(!!checked)}
                  />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-500" />
                    <label htmlFor="annual" className="text-sm font-medium cursor-pointer">
                      Plano Anual (cobrança única)
                    </label>
                  </div>
                </div>
                <Badge variant="outline" className="text-violet-600 border-violet-300">
                  -10%
                </Badge>
              </div>

              {/* Desconto PIX */}
              <div 
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-all
                  ${pixDiscount 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'border-border hover:border-primary/30'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="pix"
                    checked={pixDiscount}
                    onCheckedChange={(checked) => setPixDiscount(!!checked)}
                  />
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-green-500" />
                    <label htmlFor="pix" className="text-sm font-medium cursor-pointer">
                      Pagamento via PIX
                    </label>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  -5%
                </Badge>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-muted/80 to-muted border space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Resultado da Simulação
            </div>

            {/* Breakdown de descontos */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço original:</span>
                <span>R$ {calculation.originalPrice.toLocaleString('pt-BR')}/{calculation.period}</span>
              </div>
              
              {calculation.discounts.map((discount, index) => (
                <div key={index} className="flex justify-between text-green-600 dark:text-green-400">
                  <span>{discount.name}:</span>
                  <span>- R$ {Math.round(discount.value).toLocaleString('pt-BR')}</span>
                </div>
              ))}
              
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Valor Final:</span>
                <span className="text-primary">
                  R$ {calculation.finalPrice.toLocaleString('pt-BR')}/{calculation.period}
                  {hasMaxDiscount && <Sparkles className="inline h-4 w-4 ml-1 text-amber-500" />}
                </span>
              </div>
              
              {annualDiscount && (
                <p className="text-xs text-muted-foreground text-right">
                  ≈ R$ {calculation.monthlyEquivalent.toLocaleString('pt-BR')}/mês
                </p>
              )}
            </div>

            {/* Economia total */}
            {calculation.totalSavings > 0 && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Economia total: R$ {calculation.totalSavings.toLocaleString('pt-BR')} 
                  ({calculation.totalDiscountPercent.toFixed(1)}% de desconto)
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          <Button 
            className="w-full group"
            size="lg"
            onClick={() => navigate(`/checkout?plan=${selectedPlan}&cycle=${annualDiscount ? 'annual' : 'monthly'}${pixDiscount ? '&payment=pix' : ''}`)}
          >
            Contratar {selectedPlanData.name} Agora
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
