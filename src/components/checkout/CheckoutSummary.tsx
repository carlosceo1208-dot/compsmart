import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tag, Check, Loader2, X } from 'lucide-react';
import { planFeatures } from '@/config/planFeatures';

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  features: string[];
}

interface CheckoutSummaryProps {
  plan: Plan;
  billingCycle: 'monthly' | 'annual';
  setBillingCycle: (cycle: 'monthly' | 'annual') => void;
  paymentMethod: string;
  couponApplied: any;
  setCouponApplied?: (coupon: any) => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  validateCoupon: () => void;
  validatingCoupon: boolean;
  calculateTotal: () => number;
}

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export function CheckoutSummary({
  plan,
  billingCycle,
  setBillingCycle,
  paymentMethod,
  couponApplied,
  setCouponApplied,
  couponCode,
  setCouponCode,
  validateCoupon,
  validatingCoupon,
  calculateTotal,
}: CheckoutSummaryProps) {
  const basePrice = billingCycle === 'annual' ? plan.annual_price : plan.monthly_price;
  const total = calculateTotal();
  const savings = roundToTwoDecimals(basePrice - total);

  // Calcular desconto do cupom dinamicamente baseado no ciclo atual
  const calculateCouponDiscount = () => {
    if (!couponApplied?.coupon) return 0;
    
    const coupon = couponApplied.coupon;
    
    if (coupon.discount_type === 'percentage') {
      // Aplica percentual sobre o preço base atual (mensal ou anual)
      return roundToTwoDecimals(basePrice * (coupon.discount_value / 100));
    } else {
      // Desconto fixo - ajustar para anual se necessário
      const fixedDiscount = billingCycle === 'annual'
        ? (couponApplied.calculated_discount || 0) * 12
        : (couponApplied.calculated_discount || 0);
      return roundToTwoDecimals(fixedDiscount);
    }
  };

  const couponDiscount = calculateCouponDiscount();

  // Usar features do config centralizado
  const features = planFeatures[plan.name] || [];

  const handleRemoveCoupon = () => {
    if (setCouponApplied) {
      setCouponApplied(null);
      setCouponCode('');
    }
  };

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resumo do Pedido</span>
          <Badge variant="outline">{plan.name}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ciclo de Cobrança */}
        <div className="space-y-3">
          <Label>Ciclo de Cobrança</Label>
          <RadioGroup
            value={billingCycle}
            onValueChange={(value) => setBillingCycle(value as 'monthly' | 'annual')}
            className="grid grid-cols-2 gap-3"
          >
            <Label
              htmlFor="monthly"
              className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                billingCycle === 'monthly' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
              <span className="font-medium">Mensal</span>
              <span className="text-sm text-muted-foreground">
                R$ {plan.monthly_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </Label>
            <Label
              htmlFor="annual"
              className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors relative ${
                billingCycle === 'annual' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="annual" id="annual" className="sr-only" />
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-xs">
                Economize 10%
              </Badge>
              <span className="font-medium">Anual</span>
              <span className="text-sm text-muted-foreground">
                R$ {plan.annual_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </Label>
          </RadioGroup>
        </div>

        <Separator />

        {/* Cupom */}
        <div className="space-y-3">
          <Label htmlFor="coupon">Cupom de Desconto</Label>
          <div className="flex gap-2">
            <Input
              id="coupon"
              placeholder="Digite o código"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={!!couponApplied}
            />
            <Button
              variant="outline"
              onClick={validateCoupon}
              disabled={validatingCoupon || !!couponApplied || !couponCode.trim()}
            >
              {validatingCoupon ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : couponApplied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Tag className="h-4 w-4" />
              )}
            </Button>
          </div>
          {couponApplied && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                {couponApplied.coupon?.code}: {couponApplied.coupon?.discount_value}% OFF
              </p>
              {setCouponApplied && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemoveCoupon}
                  className="text-xs text-muted-foreground p-1 h-auto hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remover
                </Button>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Detalhamento */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>R$ {basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          
        {couponApplied?.coupon && couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Desconto do cupom ({couponApplied.coupon?.discount_value}%)</span>
            <span>-R$ {couponDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}

        {billingCycle === 'annual' && (
          <div className="flex justify-between text-green-600">
            <span>Desconto Anual (10%)</span>
            <span>incluso</span>
          </div>
        )}
        
        {paymentMethod === 'pix' && (
          <div className="flex justify-between text-green-600">
            <span>Desconto PIX (5%)</span>
            <span>-R$ {roundToTwoDecimals((basePrice - couponDiscount) * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-semibold">Total</span>
          {billingCycle === 'annual' && (
              <p className="text-xs text-muted-foreground">
                (R$ {roundToTwoDecimals(total / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês)
              </p>
            )}
          </div>
          <span className="text-2xl font-bold text-primary">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {savings > 0 && (
          <Badge variant="secondary" className="w-full justify-center bg-green-100 text-green-700">
            Você economiza R$ {savings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Badge>
        )}

        {/* Features - usando config centralizado */}
        <div className="pt-4 space-y-2">
          <p className="text-sm font-medium">Incluso no plano:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {features.slice(0, 6).map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>{feature.text}</span>
                {feature.isNew && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-primary/10 text-primary">
                    Novo
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
