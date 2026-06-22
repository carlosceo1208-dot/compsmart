import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Check, ArrowRight, ArrowLeft, Sparkles, Loader2, Brain, Shield } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string;
  plan_type: string;
  features: any;
  max_employees: number | null;
  max_users: number | null;
  sort_order: number;
}

interface PlanSelectionStepProps {
  selectedPlanId: string | null;
  selectedNr1PlanId?: string | null;
  onUpdate: (planId: string, billingCycle: 'monthly' | 'annual', nr1PlanId?: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

const CORE_TYPES = ['starter', 'medium', 'pro', 'enterprise'];

export const PlanSelectionStep = ({
  selectedPlanId,
  selectedNr1PlanId = null,
  onUpdate,
  onNext,
  onBack,
}: PlanSelectionStepProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, name, description, plan_type, features, max_employees, max_users, sort_order')
          .eq('is_active', true)
          .order('sort_order');
        if (error) throw error;
        setPlans((data as any) || []);
      } catch (e: any) {
        console.error(e);
        toast.error('Erro ao carregar planos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const corePlans = plans
    .filter((p) => CORE_TYPES.includes((p.plan_type || '').toLowerCase()))
    .sort((a, b) => a.sort_order - b.sort_order);
  const nr1Plans = plans
    .filter((p) => (p.plan_type || '').toLowerCase() === 'nr1')
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleSelectCore = (id: string) => onUpdate(id, billingCycle, selectedNr1PlanId);
  const handleSelectNr1 = (id: string | null) => {
    if (selectedPlanId) onUpdate(selectedPlanId, billingCycle, id);
    else onUpdate('', billingCycle, id);
  };

  const handleNext = () => {
    if (!selectedPlanId && !selectedNr1PlanId) {
      toast.error('Selecione ao menos um plano (Gestão Estratégica ou NR-1)');
      return;
    }
    onNext();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const renderPlanCard = (
    plan: Plan,
    selected: boolean,
    onSelect: () => void,
    accent: 'primary' | 'emerald'
  ) => {
    const ring = selected
      ? accent === 'emerald'
        ? 'border-emerald-500 bg-emerald-500/5'
        : 'border-primary bg-primary/5'
      : 'border-border hover:border-primary/50';
    return (
      <button
        type="button"
        key={plan.id}
        onClick={onSelect}
        className={`text-left relative border-2 rounded-lg p-4 transition-all ${ring}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <Label className="text-base font-bold cursor-pointer">{plan.name}</Label>
          {selected && (
            <Badge variant="secondary" className="text-xs">
              <Check className="w-3 h-3 mr-1" /> Selecionado
            </Badge>
          )}
        </div>
        {plan.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
        )}
        {Array.isArray(plan.features) && plan.features.length > 0 && (
          <ul className="space-y-1">
            {plan.features.slice(0, 4).map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        )}
        {(plan.max_employees || plan.max_users) && (
          <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground">
            {plan.max_employees ? `Até ${plan.max_employees} colaboradores` : 'Colaboradores ilimitados'}
          </div>
        )}
      </button>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Escolha seu Plano</CardTitle>
            <CardDescription>
              Os valores não são exibidos aqui — você já os conhece da landing page e os confirma no checkout.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* GRUPO 1 — CORE */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">
              Gestão Estratégica de Remuneração e Avaliação de Desempenho
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {corePlans.map((p) =>
              renderPlanCard(p, selectedPlanId === p.id, () => handleSelectCore(p.id), 'primary')
            )}
          </div>
        </section>

        {/* GRUPO 2 — NR-1 */}
        {nr1Plans.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  NR-1 — Saúde Mental & Bem-Estar (opcional)
                </h3>
              </div>
              {selectedNr1PlanId && (
                <Button variant="ghost" size="sm" onClick={() => handleSelectNr1(null)}>
                  Limpar seleção
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nr1Plans.map((p) =>
                renderPlanCard(
                  p,
                  selectedNr1PlanId === p.id,
                  () => handleSelectNr1(p.id),
                  'emerald'
                )
              )}
            </div>
          </section>
        )}

        {/* Trial */}
        <div className="bg-accent/50 border border-accent rounded-lg p-4 text-sm">
          <p className="font-semibold mb-1">🎉 30 dias grátis para teste</p>
          <p className="text-muted-foreground">
            Experimente todos os recursos sem compromisso. Cancele a qualquer momento.
          </p>
        </div>

        {/* Nav */}
        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button onClick={handleNext} className="flex-1 gap-2">
            Continuar <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
