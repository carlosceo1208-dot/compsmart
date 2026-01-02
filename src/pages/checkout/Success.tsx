import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, PartyPopper, ArrowRight, Calendar, CreditCard, Sparkles, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { planFeatures } from '@/config/planFeatures';
import { format, addDays, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CheckoutSession {
  id: string;
  plan_id: string;
  billing_cycle: string;
  amount_cents: number;
  payment_method: string;
  paid_at: string;
  plan?: {
    name: string;
  };
}

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CheckoutSession | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('checkout_sessions')
          .select(`
            id,
            plan_id,
            billing_cycle,
            amount_cents,
            payment_method,
            paid_at,
            plan:subscription_plans(name)
          `)
          .eq('id', sessionId)
          .single();

        if (error) throw error;
        
        // Transform the data to match our interface
        const sessionData: CheckoutSession = {
          id: data.id,
          plan_id: data.plan_id,
          billing_cycle: data.billing_cycle,
          amount_cents: data.amount_cents,
          payment_method: data.payment_method,
          paid_at: data.paid_at,
          plan: data.plan ? { name: (data.plan as any).name } : undefined
        };
        
        setSession(sessionData);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  const getNextBillingDate = () => {
    const paidDate = session?.paid_at ? new Date(session.paid_at) : new Date();
    if (session?.billing_cycle === 'annual') {
      return addYears(paidDate, 1);
    }
    return addDays(paidDate, 30);
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      boleto: 'Boleto Bancário'
    };
    return methods[method] || method;
  };

  const planName = session?.plan?.name || 'Seu Plano';
  const features = planFeatures[planName] || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-primary/5 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardContent className="pt-8 space-y-6">
          {/* Ícone de Sucesso */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-green-100 rounded-full animate-ping opacity-25" />
            </div>
            <div className="relative w-24 h-24 bg-green-100 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Título */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <PartyPopper className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Pagamento Confirmado!</h1>
              <PartyPopper className="h-6 w-6 text-primary transform scale-x-[-1]" />
            </div>
            <p className="text-muted-foreground">
              Sua assinatura foi ativada com sucesso. Você já pode começar a usar todos os recursos do CompSmart.
            </p>
          </div>

          {/* Detalhes da Assinatura */}
          {session && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="font-semibold">Detalhes da Assinatura</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Plano</p>
                  <p className="font-medium">{planName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ciclo</p>
                  <p className="font-medium">
                    {session.billing_cycle === 'annual' ? 'Anual' : 'Mensal'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Pago</p>
                  <p className="font-medium text-green-600">
                    R$ {(session.amount_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Forma de Pagamento</p>
                  <p className="font-medium">{formatPaymentMethod(session.payment_method)}</p>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Próxima cobrança:</span>
                <span className="font-medium">
                  {format(getNextBillingDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          )}

          {/* Recursos Incluídos */}
          {features.length > 0 && (
            <div className="space-y-3">
              <p className="font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Recursos Incluídos
              </p>
              <ul className="grid gap-2">
                {features.slice(0, 6).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature.text}</span>
                    {feature.isNew && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                        Novo
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* O que acontece agora */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2 text-blue-700 dark:text-blue-300">O que acontece agora?</p>
            <ul className="text-blue-600 dark:text-blue-400 space-y-1">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3" />
                Acesso liberado a todos os recursos do seu plano
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3" />
                E-mail de confirmação enviado
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3" />
                Fatura disponível no portal de cobrança
              </li>
            </ul>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3 pt-4">
            <Button onClick={() => navigate('/dashboard')} className="w-full" size="lg">
              Acessar Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings/billing')} className="w-full">
              Ver Detalhes da Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
