import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CompanyDataStep } from "@/components/onboarding/CompanyDataStep";
import { LogoUploadStep } from "@/components/onboarding/LogoUploadStep";
import { InitialStructureStep } from "@/components/onboarding/InitialStructureStep";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface OnboardingData {
  name: string;
  fantasy_name: string;
  cnpj: string;
  address: string;
  logo_url: string | null;
  createInitialStructure: boolean;
  headquartersName?: string;
  headquartersCode?: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    fantasy_name: "",
    cnpj: "",
    address: "",
    logo_url: null,
    createInitialStructure: false,
  });

  useEffect(() => {
    checkIfNeedsOnboarding();
  }, []);

  const checkIfNeedsOnboarding = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("root_company_id")
        .eq("id", session.user.id)
        .single();

      if (profile?.root_company_id) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      // Criar empresa principal
      const { data: company, error: companyError } = await supabase
        .from("organizational_structure")
        .insert({
          name: formData.name,
          fantasy_name: formData.fantasy_name || null,
          cnpj: formData.cnpj || null,
          address: formData.address || null,
          logo_url: formData.logo_url,
          type: "company",
          code: "EMP01",
          description: formData.fantasy_name || formData.name,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Atualizar profile do usuário
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ root_company_id: company.id })
        .eq("id", session.user.id);

      if (profileError) throw profileError;

      // Criar estrutura inicial se solicitado
      if (formData.createInitialStructure && formData.headquartersName) {
        await supabase
          .from("organizational_structure")
          .insert({
            name: formData.headquartersName,
            code: formData.headquartersCode || "MTZ01",
            type: "headquarters",
            description: formData.headquartersName,
            parent_id: null,
            root_company_id: company.id,
          });
      }

      toast.success("🎉 Empresa cadastrada com sucesso!");
      setCurrentStep(4);
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error("Erro ao cadastrar empresa: " + error.message);
      setLoading(false);
    }
  };

  if (loading && currentStep === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="max-w-md">
          <CardContent className="pt-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Bem-vindo ao CompSmart</h1>
          <p className="text-muted-foreground">
            Configure sua empresa em apenas alguns passos
          </p>
        </div>

        {currentStep < 4 && (
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Passo {currentStep} de 3</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardHeader>
          </Card>
        )}

        {currentStep === 1 && (
          <CompanyDataStep
            formData={formData}
            onUpdate={setFormData}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <LogoUploadStep
            logoUrl={formData.logo_url}
            onUpdate={(logo_url) => setFormData({ ...formData, logo_url })}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <InitialStructureStep
            formData={formData}
            onUpdate={setFormData}
            onComplete={handleComplete}
            onBack={() => setCurrentStep(2)}
            loading={loading}
          />
        )}

        {currentStep === 4 && (
          <WelcomeStep
            companyName={formData.fantasy_name || formData.name}
            logoUrl={formData.logo_url}
            onContinue={() => navigate("/dashboard")}
          />
        )}
      </div>
    </div>
  );
};

export default Onboarding;