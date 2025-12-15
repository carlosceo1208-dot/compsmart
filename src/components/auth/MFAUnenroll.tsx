import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, ShieldOff } from 'lucide-react';

interface MFAUnenrollProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factorId: string;
  onSuccess: () => void;
}

export function MFAUnenroll({ open, onOpenChange, factorId, onSuccess }: MFAUnenrollProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'confirm' | 'verify'>('confirm');
  const [code, setCode] = useState('');

  const handleUnenroll = async () => {
    if (code.length !== 6) return;

    setLoading(true);
    try {
      // First verify the code to ensure it's the owner
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        toast.error('Erro ao verificar código');
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        toast.error('Código inválido');
        setCode('');
        return;
      }

      // Now unenroll
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (unenrollError) {
        toast.error('Erro ao desativar 2FA');
        console.error('Unenroll error:', unenrollError);
        return;
      }

      toast.success('Autenticação de dois fatores desativada');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error unenrolling MFA:', error);
      toast.error('Erro ao desativar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setCode('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-destructive" />
            Desativar Autenticação de Dois Fatores
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === 'confirm' ? (
              <>
                Tem certeza que deseja desativar a autenticação de dois fatores? 
                Sua conta ficará menos protegida contra acessos não autorizados.
              </>
            ) : (
              <>
                Para confirmar a desativação, digite o código atual do seu app autenticador:
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === 'verify' && (
          <div className="flex justify-center py-4">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
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
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          {step === 'confirm' ? (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setStep('verify');
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Continuar
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleUnenroll();
              }}
              disabled={code.length !== 6 || loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                'Desativar 2FA'
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
