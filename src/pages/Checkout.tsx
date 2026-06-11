import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, QrCode, FileText, Check, ArrowLeft, Shield, Building2, User } from 'lucide-react';
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

// Funções de formatação e validação de documentos
const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  return digits.length === 11 && digits !== '00000000000';
};

const isValidCNPJ = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  return digits.length === 14 && digits !== '00000000000000';
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
const planId = searchParams.get('plan');
  const cycle = searchParams.get('cycle') || 'monthly';
  const preselectedMethod = searchParams.get('method') as 'pix' | 'credit_card' | 'debit_card' | 'boleto' | null;
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(cycle as 'monthly' | 'annual');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'boleto'>(
    preselectedMethod && ['pix', 'credit_card', 'debit_card', 'boleto'].includes(preselectedMethod) 
      ? preselectedMethod 
      : 'pix'
  );
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [autoAppliedLaunchCoupon, setAutoAppliedLaunchCoupon] = useState(false);

  // Estados para documento
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cnpj');
  const [documentValue, setDocumentValue] = useState('');
  const [savedCpf, setSavedCpf] = useState<string | null>(null);
  const [savedCnpj, setSavedCnpj] = useState<string | null>(null);
  const [useExistingDocument, setUseExistingDocument] = useState(true);

  useEffect(() => {
    if (planId) {
      fetchPlanAndUserData();
    } else {
      navigate('/#pricing');
    }
  }, [planId]);

  // Auto-aplicar cupom LANCAMENTO30 durante período de lançamento
  useEffect(() => {
    const autoApplyLaunchCoupon = async () => {
      if (!plan || autoAppliedLaunchCoupon || couponApplied) return;
      
      const launchEndDate = new Date('2026-02-06T23:59:59-03:00');
      const now = new Date();
      
      if (now <= launchEndDate) {
        try {
          const amount = billingCycle === 'annual' ? plan.annual_price : plan.monthly_price;
          
          const { data, error } = await supabase.functions.invoke('validate-coupon', {
            body: {
              coupon_code: 'LANCAMENTO30',
              plan_id: planId,
              billing_cycle: billingCycle,
              amount: amount
            }
          });

          if (!error && data.valid) {
            setCouponCode('LANCAMENTO30');
            setCouponApplied(data);
            setAutoAppliedLaunchCoupon(true);
          }
        } catch (error) {
          console.error('Erro ao auto-aplicar cupom de lançamento:', error);
        }
      }
    };

    autoApplyLaunchCoupon();
  }, [plan, autoAppliedLaunchCoupon, couponApplied, billingCycle, planId]);

  const fetchPlanAndUserData = async () => {
    try {
      // Buscar plano
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) throw planError;
      setPlan(planData);

      // Buscar dados do usuário (CPF e CNPJ da empresa)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('cpf, root_company_id')
          .eq('id', user.id)
          .single();

        if (profile?.cpf) {
          setSavedCpf(profile.cpf);
        }

        if (profile?.root_company_id) {
          // SECURITY: cnpj is admin/HR-only; fetched via secured RPC
          const { data: billing } = await supabase
            .rpc('get_company_billing_info', { _company_id: profile.root_company_id })
            .maybeSingle();

          if (billing?.cnpj) {
            setSavedCnpj(billing.cnpj);
            setDocumentType('cnpj');
          } else if (profile?.cpf) {
            setDocumentType('cpf');
          }
        } else if (profile?.cpf) {
          setDocumentType('cpf');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Plano não encontrado');
      navigate('/#pricing');
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

  const roundToTwoDecimals = (value: number): number => {
    return Math.round(value * 100) / 100;
  };

  const calculateTotal = () => {
    if (!plan) return 0;
    
    // Preço base conforme ciclo selecionado (anual já inclui 10% de desconto)
    let baseAmount = billingCycle === 'annual' ? plan.annual_price : plan.monthly_price;
    
    // Aplicar desconto do cupom sobre o preço do ciclo
    if (couponApplied?.coupon?.discount_type === 'percentage') {
      const discountPercent = couponApplied.coupon.discount_value / 100;
      baseAmount = roundToTwoDecimals(baseAmount * (1 - discountPercent));
    } else if (couponApplied?.calculated_discount) {
      // Desconto fixo - recalcular proporcional se anual
      const fixedDiscount = billingCycle === 'annual' 
        ? couponApplied.calculated_discount * 12 
        : couponApplied.calculated_discount;
      baseAmount = roundToTwoDecimals(baseAmount - fixedDiscount);
    }
    
    // PIX desconto adicional 5%
    if (paymentMethod === 'pix') {
      baseAmount = roundToTwoDecimals(baseAmount * 0.95);
    }
    
    return Math.max(baseAmount, 1);
  };

  const getDocumentToUse = (): { type: 'cpf' | 'cnpj'; value: string } | null => {
    if (useExistingDocument) {
      if (documentType === 'cnpj' && savedCnpj) {
        return { type: 'cnpj', value: savedCnpj };
      }
      if (documentType === 'cpf' && savedCpf) {
        return { type: 'cpf', value: savedCpf };
      }
    }
    
    // Usar documento digitado
    if (documentValue) {
      const isValid = documentType === 'cpf' ? isValidCPF(documentValue) : isValidCNPJ(documentValue);
      if (isValid) {
        return { type: documentType, value: documentValue };
      }
    }

    return null;
  };

  const hasValidExistingDocument = (): boolean => {
    if (documentType === 'cnpj') return !!savedCnpj;
    return !!savedCpf;
  };

  const handleCheckout = async (cardToken?: string) => {
    // Validar documento
    const document = getDocumentToUse();
    if (!document) {
      toast.error(`Por favor, insira um ${documentType.toUpperCase()} válido`);
      return;
    }

    setProcessing(true);
    try {
      // Salvar documento no perfil se for novo
      if (!useExistingDocument && documentValue) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (documentType === 'cpf') {
            await supabase
              .from('profiles')
              .update({ cpf: documentValue.replace(/\D/g, '') })
              .eq('id', user.id);
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('root_company_id')
              .eq('id', user.id)
              .single();

            if (profile?.root_company_id) {
              await supabase
                .from('company_billing')
                .upsert(
                  { company_id: profile.root_company_id, cnpj: documentValue.replace(/\D/g, '') },
                  { onConflict: 'company_id' }
                );
            }
          }
        }
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan_id: planId,
          billing_cycle: billingCycle,
          payment_method: paymentMethod,
          coupon_code: couponApplied ? couponCode : null,
          card_token: cardToken,
          document_type: document.type,
          document_value: document.value.replace(/\D/g, '')
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        
        // Tentar extrair detalhes do erro
        let errorDetails = null;
        try {
          if (error.context?.body) {
            errorDetails = JSON.parse(error.context.body);
          }
        } catch (e) {
          console.error('Error parsing error context:', e);
        }
        
        if (errorDetails?.suggestion) {
          toast.error(errorDetails.details || 'Erro ao processar pagamento', {
            description: errorDetails.suggestion,
            duration: 8000
          });
        } else {
          toast.error(errorDetails?.details || errorDetails?.error || error.message || 'Erro ao processar pagamento');
        }
        return;
      }

      if (data.status === 'paid') {
        navigate(`/checkout/success?session=${data.session_id}`);
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

  const handleDocumentChange = (value: string) => {
    const formatted = documentType === 'cpf' ? formatCPF(value) : formatCNPJ(value);
    setDocumentValue(formatted);
    setUseExistingDocument(false);
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

  const hasExistingDocument = hasValidExistingDocument();
  const currentDocument = getDocumentToUse();
  const isDocumentValid = !!currentDocument;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/#pricing')}
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
              setCouponApplied={setCouponApplied}
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
                {/* Dados do Pagador */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Dados do Pagador
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup 
                      value={documentType} 
                      onValueChange={(v: 'cpf' | 'cnpj') => {
                        setDocumentType(v);
                        setDocumentValue('');
                        setUseExistingDocument(true);
                      }}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cnpj" id="cnpj" />
                        <Label htmlFor="cnpj" className="flex items-center gap-2 cursor-pointer">
                          <Building2 className="h-4 w-4" />
                          Pessoa Jurídica (CNPJ)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cpf" id="cpf" />
                        <Label htmlFor="cpf" className="flex items-center gap-2 cursor-pointer">
                          <User className="h-4 w-4" />
                          Pessoa Física (CPF)
                        </Label>
                      </div>
                    </RadioGroup>

                    {hasExistingDocument && (
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {documentType === 'cnpj' ? 'CNPJ cadastrado' : 'CPF cadastrado'}
                            </p>
                            <p className="font-mono font-medium">
                              {documentType === 'cnpj' 
                                ? formatCNPJ(savedCnpj || '')
                                : formatCPF(savedCpf || '')}
                            </p>
                          </div>
                          {useExistingDocument && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Check className="h-3 w-3 mr-1" />
                              Selecionado
                            </Badge>
                          )}
                        </div>
                        {!useExistingDocument && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="mt-2 p-0 h-auto"
                            onClick={() => {
                              setUseExistingDocument(true);
                              setDocumentValue('');
                            }}
                          >
                            Usar documento cadastrado
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="document">
                        {hasExistingDocument 
                          ? `Ou digite um novo ${documentType.toUpperCase()}`
                          : `${documentType.toUpperCase()} *`}
                      </Label>
                      <Input
                        id="document"
                        placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                        value={documentValue}
                        onChange={(e) => handleDocumentChange(e.target.value)}
                        className={`font-mono ${
                          documentValue && !isDocumentValid && !hasExistingDocument
                            ? 'border-destructive focus-visible:ring-destructive'
                            : ''
                        }`}
                      />
                      {documentValue && (
                        <p className={`text-xs ${
                          (documentType === 'cpf' ? isValidCPF(documentValue) : isValidCNPJ(documentValue))
                            ? 'text-green-600'
                            : 'text-destructive'
                        }`}>
                          {(documentType === 'cpf' ? isValidCPF(documentValue) : isValidCNPJ(documentValue))
                            ? `✓ ${documentType.toUpperCase()} válido`
                            : `${documentType.toUpperCase()} inválido - ${documentType === 'cpf' ? '11 dígitos' : '14 dígitos'} necessários`}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <PaymentMethodSelector
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                />

                {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
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
                          disabled={processing || !isDocumentValid}
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
                        {!isDocumentValid && (
                          <p className="text-sm text-destructive">
                            Preencha um {documentType.toUpperCase()} válido para continuar
                          </p>
                        )}
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
                          disabled={processing || !isDocumentValid}
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
                        {!isDocumentValid && (
                          <p className="text-sm text-destructive">
                            Preencha um {documentType.toUpperCase()} válido para continuar
                          </p>
                        )}
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
