import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CardPaymentFormProps {
  onSubmit: (cardToken: string) => void;
  processing: boolean;
  total: number;
}

// Chave pública do Pagar.me - segura para exposição no frontend
// Usar variável de ambiente para facilitar rotação de chaves
const PAGARME_PUBLIC_KEY = import.meta.env.VITE_PAGARME_PUBLIC_KEY || '';

export function CardPaymentForm({ onSubmit, processing, total }: CardPaymentFormProps) {
  const [cardData, setCardData] = useState({
    number: '',
    holder_name: '',
    exp_month: '',
    exp_year: '',
    cvv: '',
  });
  const [tokenizing, setTokenizing] = useState(false);

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : '';
  };

  const createCardToken = async (): Promise<string> => {
    const response = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${PAGARME_PUBLIC_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'card',
        card: {
          number: cardData.number.replace(/\s/g, ''),
          holder_name: cardData.holder_name,
          exp_month: parseInt(cardData.exp_month),
          exp_year: parseInt('20' + cardData.exp_year),
          cvv: cardData.cvv
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Pagar.me tokenization error:', data?.message || 'Unknown error');
      throw new Error(data.message || 'Erro ao validar cartão');
    }
    
    // Log sem expor dados sensíveis
    console.log('Card token created successfully');
    return data.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardData.number || !cardData.holder_name || !cardData.exp_month || !cardData.exp_year || !cardData.cvv) {
      toast.error('Preencha todos os campos do cartão');
      return;
    }

    // Validação básica do número do cartão
    const cardNumber = cardData.number.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      toast.error('Número do cartão inválido');
      return;
    }

    // Validação do mês
    const month = parseInt(cardData.exp_month);
    if (month < 1 || month > 12) {
      toast.error('Mês de validade inválido');
      return;
    }

    // Validação do CVV
    if (cardData.cvv.length < 3 || cardData.cvv.length > 4) {
      toast.error('CVV inválido');
      return;
    }

    try {
      setTokenizing(true);
      const realToken = await createCardToken();
      onSubmit(realToken);
    } catch (error) {
      console.error('Error tokenizing card:', error);
      toast.error('Erro ao validar cartão. Verifique os dados e tente novamente.');
    } finally {
      setTokenizing(false);
    }
  };

  const isLoading = tokenizing || processing;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Dados do Cartão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card_number">Número do Cartão</Label>
            <Input
              id="card_number"
              placeholder="0000 0000 0000 0000"
              value={cardData.number}
              onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
              maxLength={19}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="holder_name">Nome no Cartão</Label>
            <Input
              id="holder_name"
              placeholder="NOME COMO ESTÁ NO CARTÃO"
              value={cardData.holder_name}
              onChange={(e) => setCardData({ ...cardData, holder_name: e.target.value.toUpperCase() })}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exp_month">Mês</Label>
              <Input
                id="exp_month"
                placeholder="MM"
                maxLength={2}
                value={cardData.exp_month}
                onChange={(e) => setCardData({ ...cardData, exp_month: e.target.value.replace(/\D/g, '') })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp_year">Ano</Label>
              <Input
                id="exp_year"
                placeholder="AA"
                maxLength={2}
                value={cardData.exp_year}
                onChange={(e) => setCardData({ ...cardData, exp_year: e.target.value.replace(/\D/g, '') })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                maxLength={4}
                type="password"
                value={cardData.cvv}
                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
              {tokenizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando cartão...
                </>
              ) : processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando pagamento...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pagar R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            Seus dados estão seguros e criptografados
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
