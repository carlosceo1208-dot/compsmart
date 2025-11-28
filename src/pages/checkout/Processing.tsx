import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, ArrowRight } from 'lucide-react';

export default function CheckoutProcessing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-yellow-100 rounded-full mx-auto flex items-center justify-center">
              <Clock className="h-12 w-12 text-yellow-600 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Aguardando Pagamento</h1>
            <p className="text-muted-foreground">
              Seu pedido foi registrado e estamos aguardando a confirmação do pagamento.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Próximos passos:</p>
            <ul className="text-left text-muted-foreground space-y-1">
              <li>1. Complete o pagamento (PIX ou Boleto)</li>
              <li>2. A confirmação pode levar alguns minutos (PIX) ou até 3 dias úteis (Boleto)</li>
              <li>3. Você receberá um e-mail assim que o pagamento for confirmado</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Enviamos os detalhes para seu e-mail</span>
          </div>

          <div className="space-y-3 pt-4">
            <Button onClick={() => navigate('/dashboard')} className="w-full" size="lg">
              Ir para Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/checkout')} className="w-full">
              Tentar Outro Método
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
