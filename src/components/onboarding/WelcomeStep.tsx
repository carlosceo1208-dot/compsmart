import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLogo } from "@/components/CompanyLogo";
import { ArrowRight, Users, DollarSign, Building } from "lucide-react";

interface WelcomeStepProps {
  companyName: string;
  logoUrl: string | null;
  onContinue: () => void;
}

export const WelcomeStep = ({
  companyName,
  logoUrl,
  onContinue,
}: WelcomeStepProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <CompanyLogo logoUrl={logoUrl} companyName={companyName} size="xl" />
          <div className="space-y-2">
            <CardTitle className="text-3xl">
              Bem-vindo ao CompSmart, {companyName}!
            </CardTitle>
            <p className="text-muted-foreground">
              Sua empresa está pronta para começar. Veja os próximos passos:
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Cadastrar Colaboradores</h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione os funcionários da sua empresa e organize sua equipe
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Configurar Tabelas Salariais</h3>
                  <p className="text-sm text-muted-foreground">
                    Defina as faixas salariais e a estrutura de remuneração
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Criar Estrutura Organizacional</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize departamentos, áreas e setores da empresa
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={onContinue} className="w-full gap-2" size="lg">
          Ir para Dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};