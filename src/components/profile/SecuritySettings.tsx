import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Lock,
  Key,
  CheckCircle2,
  Smartphone,
  Fingerprint,
  Server,
  FileCheck,
  Loader2
} from 'lucide-react';
import { useMFAStatus } from '@/hooks/useMFAStatus';
import { MFAEnroll } from '@/components/auth/MFAEnroll';
import { MFAUnenroll } from '@/components/auth/MFAUnenroll';

export function SecuritySettings() {
  const { hasMFA, factors, isLoading, refetch } = useMFAStatus();
  const [showEnroll, setShowEnroll] = useState(false);
  const [showUnenroll, setShowUnenroll] = useState(false);

  const securityFeatures = [
    { icon: Lock, label: 'Criptografia SSL/TLS em todas as comunicações', active: true },
    { icon: Fingerprint, label: 'Senhas protegidas com hash bcrypt', active: true },
    { icon: ShieldCheck, label: 'Proteção contra senhas vazadas (HIBP)', active: true },
    { icon: Server, label: 'Limitação de tentativas de login', active: true },
    { icon: FileCheck, label: 'Conformidade com LGPD', active: true },
  ];

  return (
    <>
      <Card className="border-emerald-200/50 dark:border-emerald-800/30 overflow-visible">
        <CardHeader className="bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-transparent dark:from-emerald-950/30 dark:via-emerald-950/10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span>Segurança da Conta</span>
            </div>
            {hasMFA && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Protegida
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Security Marketing Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg shrink-0">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Proteção de Dados CompSmart
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Seus dados estão protegidos com as mesmas tecnologias de segurança utilizadas pelos principais bancos e instituições financeiras do mundo.
                </p>
              </div>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 py-1 px-3">
              <Lock className="w-3 h-3 mr-1.5" />
              SSL/TLS
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 py-1 px-3">
              <Shield className="w-3 h-3 mr-1.5" />
              LGPD
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 py-1 px-3">
              <Key className="w-3 h-3 mr-1.5" />
              2FA
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 py-1 px-3">
              <Server className="w-3 h-3 mr-1.5" />
              Criptografia Bancária
            </Badge>
          </div>

          {/* Security Checklist */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Medidas de Segurança Ativas:</h4>
            <div className="grid gap-2">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-muted-foreground">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-emerald-100 dark:bg-emerald-800/30" />

          {/* MFA Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Autenticação de Dois Fatores (2FA)</h4>
                  <p className="text-sm text-muted-foreground">
                    Adicione uma camada extra de proteção à sua conta
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
            ) : hasMFA ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      2FA Ativo
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                    Sua conta está protegida com autenticação de dois fatores. 
                    Mesmo que sua senha seja comprometida, sua conta permanece segura.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowUnenroll(true)}
                >
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Desativar 2FA
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-700 dark:text-amber-300">
                      2FA Inativo
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    Recomendamos ativar a autenticação de dois fatores para maior segurança, 
                    especialmente se você é administrador ou tem acesso a dados sensíveis.
                  </p>
                </div>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowEnroll(true)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Ativar 2FA
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <strong>💡 Recomendado para:</strong> Administradores, Gestores de RH e usuários com acesso a dados sensíveis de remuneração.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* MFA Dialogs */}
      <MFAEnroll 
        open={showEnroll} 
        onOpenChange={setShowEnroll}
        onSuccess={refetch}
      />
      
      {factors[0] && (
        <MFAUnenroll
          open={showUnenroll}
          onOpenChange={setShowUnenroll}
          factorId={factors[0].id}
          onSuccess={refetch}
        />
      )}
    </>
  );
}
