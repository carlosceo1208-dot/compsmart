import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CompanyDataStep } from "@/components/onboarding/CompanyDataStep";
import { PlanSelectionStep } from "@/components/onboarding/PlanSelectionStep";
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
  subscription_plan_id: string | null;
  billing_cycle: 'monthly' | 'annual';
  selected_modules: string[];
  nr1_addon_enabled?: boolean;
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
    subscription_plan_id: null,
    billing_cycle: 'monthly',
    selected_modules: [],
    nr1_addon_enabled: false,
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

      // Check if user is an employee - employees should NEVER access company onboarding
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const userRoles = roles?.map(r => r.role) || [];
      const isEmployee = userRoles.includes('employee');
      
      // Block employees from accessing company onboarding
      if (isEmployee) {
        console.log('Employee attempted to access company onboarding - redirecting to dashboard');
        navigate("/dashboard");
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
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30 dias de trial

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
          subscription_plan_id: formData.subscription_plan_id,
          subscription_status: 'trial',
          billing_cycle: formData.billing_cycle,
          trial_ends_at: trialEndsAt.toISOString(),
          subscription_started_at: new Date().toISOString(),
          selected_modules: formData.selected_modules,
          nr1_addon_enabled: !!formData.nr1_addon_enabled,
        } as any)
        .select()
        .single();

      if (companyError) throw companyError;

      // Atualizar profile do usuário
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ root_company_id: company.id })
        .eq("id", session.user.id);

      if (profileError) throw profileError;

      // Criar registro de subscription history
      if (formData.subscription_plan_id) {
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('monthly_price, annual_price')
          .eq('id', formData.subscription_plan_id)
          .single();

        if (planData) {
          await supabase
            .from('company_subscriptions')
            .insert({
              company_id: company.id,
              plan_id: formData.subscription_plan_id,
              started_at: new Date().toISOString(),
              billing_cycle: formData.billing_cycle,
              monthly_price: planData.monthly_price,
              annual_price: planData.annual_price,
              status: 'trial',
              created_by: session.user.id,
            });
        }
      }

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
      setCurrentStep(5);
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

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Bem-vindo ao CompSmart</h1>
          <p className="text-muted-foreground">
            Configure sua empresa em apenas alguns passos
          </p>
        </div>

        {currentStep <= totalSteps && (
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Passo {currentStep} de {totalSteps}</span>
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
          <PlanSelectionStep
            selectedPlanId={formData.subscription_plan_id}
            onUpdate={(planId, billingCycle) => 
              setFormData({ ...formData, subscription_plan_id: planId, billing_cycle: billingCycle })
            }
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <LogoUploadStep
            logoUrl={formData.logo_url}
            onUpdate={(logo_url) => setFormData({ ...formData, logo_url })}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <InitialStructureStep
            formData={formData}
            onUpdate={setFormData}
            onComplete={handleComplete}
            onBack={() => setCurrentStep(3)}
            loading={loading}
          />
        )}

        {currentStep === 5 && (
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