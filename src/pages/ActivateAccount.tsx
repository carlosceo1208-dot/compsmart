import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Search, CheckCircle2, Building2 } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
interface FoundProfile {
  id: string;
  full_name: string;
  employee_number: string | null;
  job_title: string | null;
  grade: string | null;
  company_name?: string;
}

export default function ActivateAccount() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"search" | "activate">("search");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundProfile, setFoundProfile] = useState<FoundProfile | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const [turnstileLoading, setTurnstileLoading] = useState(true);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileError(false);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
    setTurnstileError(true);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  const handleTurnstileLoading = useCallback((loading: boolean) => {
    setTurnstileLoading(loading);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      toast.error("Informe sua Matrícula ou CPF");
      return;
    }

    setLoading(true);
    try {
      // Buscar profile por employee_number ou CPF
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name, 
          employee_number, 
          job_title, 
          grade, 
          has_system_access,
          root_company_id,
          organizational_structure:root_company_id (
            name
          )
        `)
        .or(`employee_number.eq.${identifier.trim()},cpf.eq.${identifier.trim()}`)
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        toast.error("Nenhum cadastro encontrado com essa Matrícula ou CPF");
        return;
      }

      if (profile.has_system_access) {
        toast.error("Esta conta já foi ativada. Faça login normalmente.");
        setTimeout(() => navigate("/auth"), 2000);
        return;
      }

      setFoundProfile({
        id: profile.id,
        full_name: profile.full_name,
        employee_number: profile.employee_number,
        job_title: profile.job_title,
        grade: profile.grade,
        company_name: (profile.organizational_structure as any)?.name || undefined
      });
      setStep("activate");
      
    } catch (error: any) {
      console.error("Error searching profile:", error);
      toast.error(error.message || "Erro ao buscar cadastro");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Informe seu email");
      return;
    }
    
    if (password.length < 8) {
      toast.error("Senha deve ter no mínimo 8 caracteres");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    // Validate Turnstile CAPTCHA - allow fallback if Turnstile failed after retries
    const skipTurnstile = turnstileError;
    
    if (!turnstileToken && !skipTurnstile && turnstileLoading) {
      toast.error("Aguarde a verificação de segurança...");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("activate-employee", {
        body: {
          identifier: identifier.trim(),
          email: email.trim(),
          password,
          turnstileToken: turnstileToken || undefined
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || "Erro ao ativar conta");
      }

      toast.success(data.message || "Conta ativada com sucesso!");
      setTimeout(() => navigate("/auth"), 2000);
      
    } catch (error: any) {
      console.error("Error activating account:", error);
      toast.error(error.message || "Erro ao ativar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Ativar Minha Conta</CardTitle>
          <CardDescription>
            {step === "search" 
              ? "Informe sua Matrícula ou CPF para encontrar seu cadastro"
              : "Configure seu email e senha para acessar o sistema"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "search" ? (
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Matrícula ou CPF</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Digite sua matrícula ou CPF..."
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use os dados fornecidos pelo RH da sua empresa
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar Meu Cadastro
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate("/auth")}
                  className="text-sm"
                >
                  Já tenho conta? Fazer login
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleActivate} className="space-y-4">
              {/* Dados encontrados */}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Cadastro Encontrado</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Nome:</strong> {foundProfile?.full_name}</p>
                  {foundProfile?.employee_number && (
                    <p><strong>Matrícula:</strong> {foundProfile.employee_number}</p>
                  )}
                  {foundProfile?.job_title && (
                    <p><strong>Cargo:</strong> {foundProfile.job_title}</p>
                  )}
                  {foundProfile?.company_name && (
                    <p className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {foundProfile.company_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Formulário de ativação */}
              <div className="space-y-2">
                <Label htmlFor="email">Seu Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Criar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-16"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>

              {/* Turnstile CAPTCHA */}
              <div className="flex justify-center">
                <TurnstileWidget
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                  onLoading={handleTurnstileLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || (turnstileLoading && !turnstileError && !turnstileToken)}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ativando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Ativar Minha Conta
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("search");
                  setFoundProfile(null);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                disabled={loading}
              >
                Voltar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
