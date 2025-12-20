import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import compsmartLogo from '@/assets/compsmart-logo.png';
import { SecurityFooter } from '@/components/SecurityFooter';
import { useAuthLogger } from '@/hooks/useAuthLogger';

export default function MFAVerify() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const { logAuthAttempt } = useAuthLogger();

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      // Check if user has session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Store email for logging
      setUserEmail(session.user.email || null);

      // Check AAL level
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalError) {
        console.error('AAL error:', aalError);
        navigate('/auth');
        return;
      }

      // If already at AAL2, go to dashboard
      if (aalData.currentLevel === 'aal2') {
        navigate('/dashboard');
        return;
      }

      // If no MFA required, go to dashboard
      if (aalData.nextLevel !== 'aal2') {
        navigate('/dashboard');
        return;
      }

      // Get factors to use for challenge
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError || !factorsData?.totp?.length) {
        console.error('Factors error:', factorsError);
        navigate('/auth');
        return;
      }

      const verifiedFactor = factorsData.totp.find(f => f.status === 'verified');
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
      } else {
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
      navigate('/auth');
    }
  };

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      // Create challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        setError('Erro ao verificar. Tente novamente.');
        console.error('Challenge error:', challengeError);
        setCode('');
        return;
      }

      // Verify
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        // Log failed MFA attempt
        if (userEmail) {
          logAuthAttempt({
            email: userEmail,
            attemptType: "mfa_verify",
            success: false,
            failureReason: "invalid_code",
          });
        }
        setError('Código inválido. Verifique e tente novamente.');
        console.error('Verify error:', verifyError);
        setCode('');
        return;
      }

      // Log successful MFA verification
      const { data: { session } } = await supabase.auth.getSession();
      if (userEmail) {
        logAuthAttempt({
          email: userEmail,
          attemptType: "mfa_verify",
          success: true,
          userId: session?.user?.id,
        });
      }

      toast.success('Verificação concluída!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error verifying MFA:', error);
      setError('Erro ao verificar código');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === 6 && factorId && !loading) {
      handleVerify();
    }
  }, [code, factorId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-emerald-50/30 to-background dark:via-emerald-950/10 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-emerald-200/50">
          <CardHeader className="space-y-4 text-center">
            <div className="flex flex-col items-center">
              <img src={compsmartLogo} alt="CompSmart Logo" className="w-40 h-auto object-contain" />
            </div>
            <div className="pt-4">
              <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-xl">Verificação de Segurança</CardTitle>
              <CardDescription className="mt-2">
                Digite o código de 6 dígitos do seu aplicativo autenticador
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={loading || !factorId}
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

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleVerify}
              disabled={code.length !== 6 || loading || !factorId}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                disabled={loading}
              >
                Sair e tentar novamente
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Abra seu aplicativo autenticador (Google Authenticator, Microsoft Authenticator, etc.) 
              para obter o código de verificação.
            </p>
          </CardContent>
        </Card>
      </div>

      <SecurityFooter />
    </div>
  );
}
