import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, PartyPopper, ArrowRight } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Confetti effect would go here
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-green-100 rounded-full animate-ping opacity-25" />
            </div>
            <div className="relative w-24 h-24 bg-green-100 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <PartyPopper className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Pagamento Confirmado!</h1>
              <PartyPopper className="h-6 w-6 text-primary transform scale-x-[-1]" />
            </div>
            <p className="text-muted-foreground">
              Sua assinatura foi ativada com sucesso. Você já pode começar a usar todos os recursos do CompSmart.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">O que acontece agora?</p>
            <ul className="text-left text-muted-foreground space-y-1">
              <li>✓ Acesso liberado a todos os recursos do seu plano</li>
              <li>✓ E-mail de confirmação enviado</li>
              <li>✓ Fatura disponível no portal de cobrança</li>
            </ul>
          </div>

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
