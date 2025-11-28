import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, QrCode, FileText } from 'lucide-react';

interface PaymentMethodSelectorProps {
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
  setPaymentMethod: (method: 'pix' | 'credit_card' | 'boleto') => void;
}

export function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
}: PaymentMethodSelectorProps) {
  const methods = [
    {
      id: 'pix' as const,
      name: 'PIX',
      description: 'Pagamento instantâneo',
      icon: QrCode,
      badge: '5% OFF',
      badgeClass: 'bg-green-100 text-green-700',
    },
    {
      id: 'credit_card' as const,
      name: 'Cartão de Crédito',
      description: 'Até 12x sem juros',
      icon: CreditCard,
      badge: null,
      badgeClass: '',
    },
    {
      id: 'boleto' as const,
      name: 'Boleto Bancário',
      description: 'Vencimento em 3 dias',
      icon: FileText,
      badge: null,
      badgeClass: '',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Método de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as 'pix' | 'credit_card' | 'boleto')}
          className="space-y-3"
        >
          {methods.map((method) => (
            <Label
              key={method.id}
              htmlFor={method.id}
              className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                paymentMethod === method.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
              <div className={`p-3 rounded-full ${
                paymentMethod === method.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <method.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{method.name}</span>
                  {method.badge && (
                    <Badge className={method.badgeClass}>{method.badge}</Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{method.description}</span>
              </div>
              {paymentMethod === method.id && (
                <div className="h-3 w-3 rounded-full bg-primary" />
              )}
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
