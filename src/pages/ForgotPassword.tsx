import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { z } from "zod";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { useRateLimiter } from "@/hooks/useRateLimiter";

const emailSchema = z.object({
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const rateLimiter = useRateLimiter({
    maxAttempts: 3,
    windowMs: 60000,
    cooldownMs: 60000, // 1 minute cooldown for password recovery
  });

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

    setLoading(true);

    try {
      const validation = emailSchema.parse({ email: email.trim().toLowerCase() });

      const { error } = await supabase.auth.resetPasswordForEmail(validation.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Generic message to prevent email enumeration
        toast.error("Não foi possível processar sua solicitação. Tente novamente.");
        return;
      }

      // Always show success to prevent email enumeration
      setEmailSent(true);
      toast.success("Se este email estiver cadastrado, você receberá um link de redefinição.");
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex flex-col items-center mb-2">
            <img src={compsmartLogo} alt="CompSmart Logo" className="w-32 h-auto md:w-36 object-contain" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Redefinir Senha</CardTitle>
            <CardDescription className="text-base mt-2">
              {emailSent
                ? "Email enviado com sucesso"
                : "Digite seu email para receber o link de redefinição"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Rate Limiting Warning */}
          {rateLimiter.isBlocked && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                Muitas tentativas. Aguarde {rateLimiter.remainingTime}s para tentar novamente.
              </span>
            </div>
          )}

          {emailSent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link de redefinição de senha.
                Verifique sua caixa de entrada e siga as instruções.
              </p>
              <Button
                onClick={() => navigate("/auth")}
                className="w-full"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || rateLimiter.isBlocked}
                  maxLength={255}
                  autoComplete="email"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loading || rateLimiter.isBlocked}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Link de Redefinição"
                )}
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/auth")}
                className="w-full"
                variant="outline"
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
