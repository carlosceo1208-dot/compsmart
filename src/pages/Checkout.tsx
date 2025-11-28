import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CreditCard, QrCode, FileText, Tag, Check, ArrowLeft, Shield } from 'lucide-react';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { PixPayment } from '@/components/checkout/PixPayment';
import { BoletoPayment } from '@/components/checkout/BoletoPayment';
import { CardPaymentForm } from '@/components/checkout/CardPaymentForm';

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  features: any;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const planId = searchParams.get('plan');
  const cycle = searchParams.get('cycle') || 'monthly';
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(cycle as 'monthly' | 'annual');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  useEffect(() => {
    if (planId) {
      fetchPlan();
    } else {
      navigate('/pricing');
    }
  }, [planId]);

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      setPlan(data);
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('Plano não encontrado');
      navigate('/pricing');
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const amount = billingCycle === 'annual' ? plan?.annual_price : plan?.monthly_price;
      
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: {
          coupon_code: couponCode,
          plan_id: planId,
          billing_cycle: billingCycle,
          amount: amount
        }
      });

      if (error) throw error;

      if (data.valid) {
        setCouponApplied(data);
        toast.success('Cupom aplicado com sucesso!');
      } else {
        toast.error(data.error || 'Cupom inválido');
        setCouponApplied(null);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('Erro ao validar cupom');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const calculateTotal = () => {
    if (!plan) return 0;
    
    let amount = billingCycle === 'annual' ? plan.annual_price : plan.monthly_price;
    
    if (couponApplied?.calculated_discount) {
      amount -= couponApplied.calculated_discount;
    }
    
    // PIX desconto adicional
    if (paymentMethod === 'pix') {
      amount *= 0.95; // 5% desconto
    }
    
    return Math.max(amount, 1);
  };

  const handleCheckout = async (cardToken?: string) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan_id: planId,
          billing_cycle: billingCycle,
          payment_method: paymentMethod,
          coupon_code: couponApplied ? couponCode : null,
          card_token: cardToken
        }
      });

      if (error) throw error;

      if (data.status === 'paid') {
        navigate('/checkout/success');
      } else {
        setCheckoutResult(data);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/pricing')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Planos
        </Button>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Resumo do Pedido */}
          <div className="lg:col-span-2">
            <CheckoutSummary
              plan={plan}
              billingCycle={billingCycle}
              setBillingCycle={setBillingCycle}
              paymentMethod={paymentMethod}
              couponApplied={couponApplied}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              validateCoupon={validateCoupon}
              validatingCoupon={validatingCoupon}
              calculateTotal={calculateTotal}
            />
          </div>

          {/* Método de Pagamento */}
          <div className="lg:col-span-3 space-y-6">
            {!checkoutResult ? (
              <>
                <PaymentMethodSelector
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                />

                {paymentMethod === 'credit_card' && (
                  <CardPaymentForm
                    onSubmit={handleCheckout}
                    processing={processing}
                    total={calculateTotal()}
                  />
                )}

                {paymentMethod === 'pix' && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <QrCode className="h-16 w-16 mx-auto text-primary" />
                        <p className="text-muted-foreground">
                          Ao clicar em "Gerar PIX", você receberá um QR Code para pagamento instantâneo.
                        </p>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          5% de desconto no PIX
                        </Badge>
                        <Button 
                          onClick={() => handleCheckout()} 
                          disabled={processing}
                          className="w-full"
                          size="lg"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Gerando PIX...
                            </>
                          ) : (
                            <>
                              <QrCode className="h-4 w-4 mr-2" />
                              Gerar PIX - R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {paymentMethod === 'boleto' && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <FileText className="h-16 w-16 mx-auto text-primary" />
                        <p className="text-muted-foreground">
                          O boleto será gerado com vencimento em 3 dias úteis. 
                          Sua assinatura será ativada após a confirmação do pagamento.
                        </p>
                        <Button 
                          onClick={() => handleCheckout()} 
                          disabled={processing}
                          className="w-full"
                          size="lg"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Gerando Boleto...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              Gerar Boleto - R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                {paymentMethod === 'pix' && checkoutResult.pix && (
                  <PixPayment
                    qrCode={checkoutResult.pix.qr_code}
                    qrCodeUrl={checkoutResult.pix.qr_code_url}
                    expiresAt={checkoutResult.pix.expires_at}
                    amount={calculateTotal()}
                  />
                )}

                {paymentMethod === 'boleto' && checkoutResult.boleto && (
                  <BoletoPayment
                    url={checkoutResult.boleto.url}
                    barcode={checkoutResult.boleto.barcode}
                    dueAt={checkoutResult.boleto.due_at}
                    amount={calculateTotal()}
                  />
                )}
              </>
            )}

            {/* Segurança */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Pagamento 100% seguro com criptografia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
