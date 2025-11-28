import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Clock, CheckCircle, QrCode } from 'lucide-react';

interface PixPaymentProps {
  qrCode: string;
  qrCodeUrl?: string;
  expiresAt: string;
  amount: number;
}

export function PixPayment({ qrCode, qrCodeUrl, expiresAt, amount }: PixPaymentProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar código');
    }
  };

  if (timeLeft === 0) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 text-center">
          <div className="text-destructive mb-4">
            <Clock className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">PIX Expirado</h3>
          <p className="text-muted-foreground mb-4">
            O tempo para pagamento expirou. Gere um novo QR Code para continuar.
          </p>
          <Button onClick={() => window.location.reload()}>
            Gerar Novo PIX
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pague com PIX
          </CardTitle>
          <Badge variant="outline" className={`${timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(timeLeft)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-xl border-2 border-primary/20">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code PIX" 
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-muted flex items-center justify-center">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Valor */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Valor a pagar</p>
          <p className="text-3xl font-bold text-primary">
            R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Código Copia e Cola */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-center">Ou copie o código PIX:</p>
          <div className="relative">
            <div className="p-3 bg-muted rounded-lg text-xs font-mono break-all max-h-20 overflow-y-auto">
              {qrCode}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
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
          <p className="font-medium text-foreground">Como pagar:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Abra o app do seu banco</li>
            <li>Escolha pagar com PIX</li>
            <li>Escaneie o QR Code ou cole o código</li>
            <li>Confirme as informações e finalize</li>
          </ol>
          <p className="text-xs mt-4">
            Após o pagamento, sua assinatura será ativada automaticamente em alguns segundos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
