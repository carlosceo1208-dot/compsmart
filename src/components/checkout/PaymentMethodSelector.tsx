import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, QrCode, Barcode, Check, Zap, Shield, Clock } from 'lucide-react';

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
      description: 'Pagamento instantâneo • Confirmação imediata',
      subDescription: 'Use o app do seu banco para escanear o QR Code',
      features: ['Disponível 24/7', 'Sem taxas adicionais'],
      icon: QrCode,
      featureIcon: Zap,
      badge: '5% OFF',
      badgeClass: 'bg-green-500 text-white border-green-500',
      colorClasses: {
        selected: 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100/50 ring-2 ring-green-200',
        hover: 'hover:border-green-300 hover:bg-green-50/30',
        icon: { 
          selected: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200', 
          default: 'bg-green-100 text-green-600' 
        },
        check: 'text-green-500 bg-green-100',
        feature: 'text-green-600'
      }
    },
    {
      id: 'credit_card' as const,
      name: 'Cartão de Crédito',
      description: 'Até 12x sem juros • Aprovação em segundos',
      subDescription: 'Visa, Mastercard, Elo, American Express e outras',
      features: ['Parcelamento facilitado', 'Máxima segurança'],
      icon: CreditCard,
      featureIcon: Shield,
      badge: 'Mais usado',
      badgeClass: 'bg-violet-500 text-white border-violet-500',
      colorClasses: {
        selected: 'border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 shadow-lg shadow-violet-100/50 ring-2 ring-violet-200',
        hover: 'hover:border-violet-300 hover:bg-violet-50/30',
        icon: { 
          selected: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200', 
          default: 'bg-violet-100 text-violet-600' 
        },
        check: 'text-violet-500 bg-violet-100',
        feature: 'text-violet-600'
      }
    },
    {
      id: 'boleto' as const,
      name: 'Boleto Bancário',
      description: 'Vencimento em 3 dias úteis • Qualquer banco',
      subDescription: 'Compensação em até 2 dias úteis após pagamento',
      features: ['Pague onde preferir', 'Método tradicional'],
      icon: Barcode,
      featureIcon: Clock,
      badge: null,
      badgeClass: '',
      colorClasses: {
        selected: 'border-blue-500 bg-gradient-to-br from-blue-50 to-sky-50 shadow-lg shadow-blue-100/50 ring-2 ring-blue-200',
        hover: 'hover:border-blue-300 hover:bg-blue-50/30',
        icon: { 
          selected: 'bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-lg shadow-blue-200', 
          default: 'bg-blue-100 text-blue-600' 
        },
        check: 'text-blue-500 bg-blue-100',
        feature: 'text-blue-600'
      }
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Método de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as 'pix' | 'credit_card' | 'boleto')}
          className="space-y-4"
        >
          {methods.map((method) => {
            const isSelected = paymentMethod === method.id;
            
            return (
              <Label
                key={method.id}
                htmlFor={method.id}
                className={`
                  relative flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer 
                  transition-all duration-300 ease-out overflow-hidden
                  ${isSelected ? method.colorClasses.selected : `border-border ${method.colorClasses.hover}`}
                `}
              >
                <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                
                {/* Icon Container */}
                <div className={`
                  p-3.5 rounded-xl transition-all duration-300 flex-shrink-0
                  ${isSelected ? method.colorClasses.icon.selected : method.colorClasses.icon.default}
                `}>
                  <method.icon className="h-6 w-6" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title + Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base">{method.name}</span>
                    {method.badge && (
                      <Badge className={`${method.badgeClass} text-xs px-2 py-0.5 font-medium`}>
                        {method.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Main Description */}
                  <p className="text-sm font-medium text-foreground/80 mt-1">
                    {method.description}
                  </p>
                  
                  {/* Sub Description */}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {method.subDescription}
                  </p>
                  
                  {/* Features */}
                  <div className="flex items-center gap-3 mt-2">
                    {method.features.map((feature, idx) => (
                      <span 
                        key={idx} 
                        className={`
                          flex items-center gap-1 text-xs font-medium
                          ${isSelected ? method.colorClasses.feature : 'text-muted-foreground'}
                        `}
                      >
                        <method.featureIcon className="h-3 w-3" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Selection Indicator */}
                {isSelected && (
                  <div className={`
                    absolute top-3 right-3 p-1 rounded-full transition-all duration-300
                    ${method.colorClasses.check}
                  `}>
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </Label>
            );
          })}
        </RadioGroup>
        
        {/* Security Note */}
        <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Todos os pagamentos são processados com criptografia de ponta a ponta
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
