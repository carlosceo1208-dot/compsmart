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

export function CardPaymentForm({ onSubmit, processing, total }: CardPaymentFormProps) {
  const [cardData, setCardData] = useState({
    number: '',
    holder_name: '',
    exp_month: '',
    exp_year: '',
    cvv: '',
  });

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!cardData.number || !cardData.holder_name || !cardData.exp_month || !cardData.exp_year || !cardData.cvv) {
      toast.error('Preencha todos os campos do cartão');
      return;
    }

    try {
      // Em produção, usar SDK Pagar.me para tokenizar
      // Por enquanto, simulando token
      const mockToken = `card_token_${Date.now()}`;
      
      // Aqui você integraria com o SDK Pagar.me para tokenização real:
      // const card = pagarme.card({
      //   number: cardData.number.replace(/\s/g, ''),
      //   holder_name: cardData.holder_name,
      //   exp_month: cardData.exp_month,
      //   exp_year: cardData.exp_year,
      //   cvv: cardData.cvv
      // });
      // const token = await card.createToken();

      onSubmit(mockToken);
    } catch (error) {
      console.error('Error tokenizing card:', error);
      toast.error('Erro ao processar cartão');
    }
  };

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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="holder_name">Nome no Cartão</Label>
            <Input
              id="holder_name"
              placeholder="NOME COMO ESTÁ NO CARTÃO"
              value={cardData.holder_name}
              onChange={(e) => setCardData({ ...cardData, holder_name: e.target.value.toUpperCase() })}
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
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={processing} className="w-full" size="lg">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
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
