import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, QrCode, Key, CheckCircle2, Copy } from 'lucide-react';

interface MFAEnrollProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MFAEnroll({ open, onOpenChange, onSuccess }: MFAEnrollProps) {
  const [step, setStep] = useState<'qr' | 'verify' | 'success'>('qr');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'CompSmart Authenticator',
      });

      if (error) {
        toast.error('Erro ao iniciar configuração do 2FA');
        console.error('MFA enroll error:', error);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (error) {
      console.error('Error starting MFA enrollment:', error);
      toast.error('Erro ao configurar 2FA');
    } finally {
      setEnrolling(false);
    }
  };

  const verifyAndActivate = async () => {
    if (!factorId || verifyCode.length !== 6) return;

    setLoading(true);
    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        toast.error('Erro ao verificar código');
        console.error('MFA challenge error:', challengeError);
        return;
      }

      // Verify the challenge
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) {
        toast.error('Código inválido. Verifique e tente novamente.');
        console.error('MFA verify error:', verifyError);
        setVerifyCode('');
        return;
      }

      setStep('success');
      toast.success('Autenticação de dois fatores ativada com sucesso!');
      
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error verifying MFA:', error);
      toast.error('Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success('Código copiado!');
    }
  };

  const handleClose = () => {
    setStep('qr');
    setFactorId(null);
    setQrCode(null);
    setSecret(null);
    setVerifyCode('');
    onOpenChange(false);
  };

  // Auto-start enrollment when dialog opens
  if (open && !factorId && !enrolling) {
    startEnrollment();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-emerald-600" />
            Ativar Autenticação de Dois Fatores
          </DialogTitle>
          <DialogDescription>
            Proteja sua conta com uma camada extra de segurança
          </DialogDescription>
        </DialogHeader>

        {step === 'qr' && (
          <div className="space-y-6">
            {enrolling ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="mt-2 text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            ) : qrCode ? (
              <>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium mb-3">
                      1. Escaneie este QR Code com seu app autenticador:
                    </p>
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-lg border shadow-sm">
                        <img 
                          src={qrCode} 
                          alt="QR Code para autenticador" 
                          className="w-48 h-48"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-center">
                      Ou digite o código manualmente:
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="flex-1 text-sm font-mono break-all">
                        {secret}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copySecret}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Use Google Authenticator, Microsoft Authenticator, Authy ou outro app compatível.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setStep('verify')}>
                    Próximo
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <QrCode className="h-12 w-12 mx-auto text-emerald-600" />
              <div>
                <p className="text-sm font-medium mb-2">
                  2. Digite o código de 6 dígitos do seu app:
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verifyCode}
                    onChange={setVerifyCode}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep('qr')} disabled={loading}>
                Voltar
              </Button>
              <Button 
                onClick={verifyAndActivate} 
                disabled={verifyCode.length !== 6 || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Ativar 2FA'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600" />
            <div>
              <h3 className="text-lg font-semibold text-emerald-700">2FA Ativado!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sua conta agora está protegida com autenticação de dois fatores.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
