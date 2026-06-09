import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, Loader2, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import compsmartLogo from '@/assets/compsmart-logo.png';
import { SecurityFooter } from '@/components/SecurityFooter';

/**
 * Página de enrollment OBRIGATÓRIO de MFA para super admins.
 * Sem possibilidade de "pular" — apenas Cadastrar 2FA ou Sair.
 */
export default function MFARequired() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Verifica se é realmente super_admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const isSuperAdmin = roles?.some((r) => r.role === 'super_admin');
      if (!isSuperAdmin) {
        navigate('/dashboard');
        return;
      }

      // Se já tem MFA verificado, sai daqui
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verified = factorsData?.totp?.find((f) => f.status === 'verified');
      if (verified) {
        navigate('/super-admin');
        return;
      }

      // Limpa fatores não-verificados antigos
      const unverified = factorsData?.totp?.filter((f) => f.status !== 'verified') || [];
      for (const f of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      await startEnrollment();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEnrollment = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `CompSmart SuperAdmin ${Date.now()}`,
    });
    setEnrolling(false);
    if (error || !data) {
      toast.error('Erro ao gerar QR Code');
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
  };

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) {
        toast.error('Código inválido. Tente novamente.');
        setCode('');
        return;
      }
      setDone(true);
      toast.success('2FA ativado! Redirecionando...');
      setTimeout(() => navigate('/super-admin'), 1500);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao verificar código');
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success('Código copiado');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-emerald-50/30 to-background dark:via-emerald-950/10 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-emerald-200/50">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <img src={compsmartLogo} alt="CompSmart" className="w-32 h-auto" />
            </div>
            <div className="pt-2">
              <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-3">
                <Shield className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-xl">Autenticação de 2 Fatores Obrigatória</CardTitle>
              <CardDescription className="mt-2">
                Sua conta tem privilégios de Super Admin. Por política de segurança, é necessário ativar
                o 2FA antes de continuar.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {done ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-600" />
                <p className="font-semibold text-emerald-700">2FA ativado com sucesso!</p>
              </div>
            ) : loading || enrolling ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="mt-2 text-sm text-muted-foreground">Gerando QR Code seguro...</p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex gap-2 text-sm text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Use um app autenticador (Google Authenticator, Microsoft Authenticator, Authy, 1Password).
                  </span>
                </div>

                {qrCode && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-center">
                      1. Escaneie o QR Code com seu app:
                    </p>
                    <div className="flex justify-center">
                      <div className="p-3 bg-white rounded-lg border shadow-sm">
                        <img src={qrCode} alt="QR Code" className="w-44 h-44" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <code className="flex-1 text-xs font-mono break-all">{secret}</code>
                      <Button variant="ghost" size="sm" onClick={copySecret}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium text-center">
                    2. Digite o código de 6 dígitos:
                  </p>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={code} onChange={setCode} disabled={verifying}>
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

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleVerify}
                  disabled={code.length !== 6 || verifying}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Ativar 2FA e continuar'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Sair sem ativar
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <SecurityFooter />
    </div>
  );
}
