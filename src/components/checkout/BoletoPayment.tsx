import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, CheckCircle, FileText, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BoletoPaymentProps {
  url: string;
  barcode: string;
  dueAt: string;
  amount: number;
}

export function BoletoPayment({ url, barcode, dueAt, amount }: BoletoPaymentProps) {
  const [copied, setCopied] = useState(false);

  const copyBarcode = async () => {
    try {
      await navigator.clipboard.writeText(barcode);
      setCopied(true);
      toast.success('Código de barras copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar código');
    }
  };

  const formattedDueDate = format(new Date(dueAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Boleto Bancário
          </CardTitle>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
            <Calendar className="h-3 w-3 mr-1" />
            Vence em {formattedDueDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Valor */}
        <div className="text-center p-6 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Valor do boleto</p>
          <p className="text-3xl font-bold text-primary">
            R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Ações */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => window.open(url, '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Boleto
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open(url, '_blank')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Visualizar PDF
          </Button>
        </div>

        {/* Código de Barras */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Linha digitável:</p>
          <div className="relative">
            <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {barcode}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyBarcode}
              className="absolute top-1 right-1"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
          <p className="font-medium text-foreground">Informações importantes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>O boleto pode ser pago em qualquer banco, lotérica ou app bancário</li>
            <li>A compensação pode levar até 3 dias úteis</li>
            <li>Sua assinatura será ativada após a confirmação do pagamento</li>
            <li>Não efetue o pagamento após a data de vencimento</li>
          </ul>
        </div>

        {/* Alerta */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <strong>Atenção:</strong> Após o pagamento, aguarde a confirmação automática. 
          Você receberá um e-mail quando sua assinatura for ativada.
        </div>
      </CardContent>
    </Card>
  );
}
