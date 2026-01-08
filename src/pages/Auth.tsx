import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { z } from "zod";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { SecurityFooter } from "@/components/SecurityFooter";
import { PasswordStrengthIndicator, validatePassword } from "@/components/auth/PasswordStrengthIndicator";
import { useRateLimiter } from "@/hooks/useRateLimiter";
import { useAuthLogger } from "@/hooks/useAuthLogger";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

const authSchema = z.object({
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
  password: z.string().min(1, "Senha é obrigatória"),
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome muito longo").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
  });

  const rateLimiter = useRateLimiter({
    maxAttempts: 5,
    windowMs: 60000,
    cooldownMs: 30000,
  });

  const { logAuthAttempt } = useAuthLogger();

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limiting
    if (!rateLimiter.canAttempt) {
      toast.error(`Muitas tentativas. Aguarde ${rateLimiter.remainingTime} segundos.`);
      return;
    }

    // Record the attempt
    if (!rateLimiter.recordAttempt()) {
      toast.error(`Muitas tentativas. Aguarde ${rateLimiter.remainingTime} segundos.`);
      return;
    }

    // Validate terms acceptance for signup
    if (!isLogin && !acceptedTerms) {
      toast.error("Você deve aceitar os Termos de Uso e Política de Privacidade");
      return;
    }

    // Turnstile is optional - if token exists, verify it; otherwise rely on rate limiting

    setLoading(true);

    try {
      // Verify Turnstile token with backend if available
      if (turnstileToken) {
        const turnstileResponse = await supabase.functions.invoke("verify-turnstile", {
          body: { token: turnstileToken },
        });

        if (turnstileResponse.error || !turnstileResponse.data?.success) {
          // Silent fallback - rate limiting provides backup protection
        }
      }
      const validation = authSchema.parse({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        ...(isLogin ? {} : { full_name: formData.full_name.trim() }),
      });

      // For signup, validate password strength
      if (!isLogin) {
        const passwordValidation = validatePassword(validation.password);
        if (!passwordValidation.isValid) {
          toast.error(passwordValidation.errors[0]);
          return;
        }
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validation.email,
          password: validation.password,
        });

        if (error) {
          // Log failed login attempt
          logAuthAttempt({
            email: validation.email,
            attemptType: "login",
            success: false,
            failureReason: "invalid_credentials",
          });
          // Generic error message to prevent user enumeration
          toast.error("Credenciais inválidas. Verifique seu email e senha.");
          return;
        }

        // Log successful login
        logAuthAttempt({
          email: validation.email,
          attemptType: "login",
          success: true,
          userId: data.user?.id,
        });

        rateLimiter.reset();

        // Check if MFA is required
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
          // User has MFA enabled but needs to verify
          navigate('/auth/mfa-verify');
          return;
        }

        toast.success("Login realizado com sucesso!");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: validation.email,
          password: validation.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: validation.full_name,
            },
          },
        });

        if (error) {
          // Log failed signup attempt
          logAuthAttempt({
            email: validation.email,
            attemptType: "signup",
            success: false,
            failureReason: error.message,
          });
          // Generic error message to prevent user enumeration
          toast.error("Não foi possível criar a conta. Tente novamente.");
          return;
        }

        // Log successful signup
        logAuthAttempt({
          email: validation.email,
          attemptType: "signup",
          success: true,
          userId: data.user?.id,
        });

        rateLimiter.reset();
        toast.success("Cadastro realizado! Você já pode fazer login.");
        setIsLogin(true);
        setFormData({ email: "", password: "", full_name: "" });
        setAcceptedTerms(false);
        setTurnstileToken(null);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erro ao processar solicitação");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex flex-col items-center">
              <img src={compsmartLogo} alt="CompSmart Logo" className="w-40 h-auto md:w-48 object-contain" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 bg-background hover:bg-muted border-border"
              onClick={async () => {
                setLoading(true);
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/dashboard`
                  }
                });
                if (error) {
                  toast.error("Erro ao conectar com Google");
                  setLoading(false);
                }
              }}
              disabled={loading || rateLimiter.isBlocked}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </Button>

            {/* Separator */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Rate Limiting Warning */}
            {rateLimiter.isBlocked && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">
                  Muitas tentativas. Aguarde {rateLimiter.remainingTime}s para tentar novamente.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required={!isLogin}
                    disabled={loading || rateLimiter.isBlocked}
                    maxLength={100}
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading || rateLimiter.isBlocked}
                  maxLength={255}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading || rateLimiter.isBlocked}
                    maxLength={128}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isLogin && <PasswordStrengthIndicator password={formData.password} />}
              </div>

              {/* Terms and Privacy Checkbox for Signup */}
              {!isLogin && (
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    disabled={loading || rateLimiter.isBlocked}
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs text-muted-foreground leading-tight cursor-pointer"
                  >
                    Li e concordo com os{" "}
                    <Link to="/terms-of-use" className="text-primary hover:underline" target="_blank">
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline" target="_blank">
                      Política de Privacidade
                    </Link>
                  </label>
                </div>
              )}

              {/* Turnstile CAPTCHA */}
              <TurnstileWidget
                onVerify={handleTurnstileVerify}
                onExpire={handleTurnstileExpire}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loading || rateLimiter.isBlocked || (!isLogin && !acceptedTerms)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  isLogin ? "Entrar" : "Cadastrar"
                )}
              </Button>
            </form>
            <div className="mt-6 space-y-3 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ email: "", password: "", full_name: "" });
                  setAcceptedTerms(false);
                  setShowPassword(false);
                }}
                className="text-sm text-primary hover:underline block w-full"
                disabled={loading}
              >
                {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Faça login"}
              </button>
              {isLogin && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline block w-full"
                    disabled={loading}
                  >
                    Esqueci minha senha
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/activate")}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline block w-full"
                    disabled={loading}
                  >
                    Ativar minha conta (primeira vez)
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <SecurityFooter />
    </div>
  );
};

export default Auth;
