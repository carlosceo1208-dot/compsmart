import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Lock, Clock, Mail, LogOut, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import compsmartLogo from "@/assets/compsmart-logo.png";

interface TrialExpiredBlockScreenProps {
  daysUntilDeletion: number | null;
  companyName: string;
}

export const TrialExpiredBlockScreen = ({ 
  daysUntilDeletion, 
  companyName 
}: TrialExpiredBlockScreenProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  const daysText = daysUntilDeletion !== null 
    ? daysUntilDeletion === 1 
      ? "1 dia" 
      : `${daysUntilDeletion} dias`
    : "poucos dias";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="relative z-10 max-w-lg w-full border-red-500/30 bg-slate-900/90 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <img src={compsmartLogo} alt="CompSmart" className="h-16 w-auto opacity-80" />
          </div>

          {/* Lock Icon */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-red-500/20 border-2 border-red-500/40">
              <Lock className="h-10 w-10 text-red-400" />
            </div>
          </div>

          <CardTitle className="text-2xl font-bold text-white">
            Acesso Bloqueado
          </CardTitle>
          <CardDescription className="text-slate-400">
            O período de teste gratuito expirou para a empresa <span className="text-white font-medium">{companyName}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Warning Alert */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold text-sm">
                ⚠️ ATENÇÃO: Exclusão de Dados
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Toda sua base de dados será <strong className="text-red-300">permanentemente excluída</strong> em{" "}
                <span className="text-red-300 font-bold">{daysText}</span>.
              </p>
            </div>
          </div>

          {/* Countdown */}
          {daysUntilDeletion !== null && (
            <div className="text-center py-6 rounded-lg bg-slate-800/50 border border-slate-700">
              <Clock className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <div className="text-5xl font-bold text-amber-400">{daysUntilDeletion}</div>
              <div className="text-slate-400 text-sm mt-1">dias para exclusão dos dados</div>
            </div>
          )}

          {/* What happens */}
          <div className="space-y-2 text-sm text-slate-400">
            <p className="font-medium text-slate-300">Para manter seus dados:</p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Escolha um plano que atenda suas necessidades
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Todos os seus dados serão preservados
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Acesso imediato após o pagamento
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25"
              onClick={() => navigate("/pricing")}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Ver Planos e Assinar
            </Button>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => window.open('mailto:comercial@compsmart.com.br', '_blank')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Falar com Comercial
              </Button>

              <Button 
                variant="ghost" 
                className="text-slate-400 hover:text-slate-300 hover:bg-slate-800"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-700">
            <p>Precisa de ajuda? Entre em contato:</p>
            <p className="text-slate-400 mt-1">
              comercial@compsmart.com.br | (11) 99999-9999
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
