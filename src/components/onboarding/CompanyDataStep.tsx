import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, ArrowRight, Cog, BarChart3, Target, ShieldCheck, Activity, Smile, Network, HeartPulse } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface CompanyDataStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

type ModuleKey = "Core" | "Insight" | "Match";

const MODULES: Array<{
  key: ModuleKey;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconWrap: string;
}> = [
  {
    key: "Core",
    title: "Core",
    description: "Gestão interna de remuneração, estrutura de cargos e desempenho",
    icon: Cog,
    accent: "border-emerald-500 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20",
    iconWrap: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    key: "Insight",
    title: "Insight",
    description: "Inteligência salarial e comparação com o mercado",
    icon: BarChart3,
    accent: "border-blue-500 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20",
    iconWrap: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    key: "Match",
    title: "Match",
    description: "Descrição de cargos e job matching inteligente",
    icon: Target,
    accent: "border-amber-500 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20",
    iconWrap: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
];

export const CompanyDataStep = ({ formData, onUpdate, onNext }: CompanyDataStepProps) => {
  const selectedModules: string[] = formData.selected_modules ?? [];

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
      );
    }
    return value;
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    onUpdate({ ...formData, cnpj: formatted });
  };

  const toggleModule = (key: ModuleKey) => {
    const exists = selectedModules.includes(key);
    const next = exists
      ? selectedModules.filter((m) => m !== key)
      : [...selectedModules, key];
    onUpdate({ ...formData, selected_modules: next });
  };

  const handleContinue = () => {
    if (formData.name.trim().length === 0) return;
    if (selectedModules.length === 0) {
      toast.error("Selecione pelo menos um módulo para continuar");
      return;
    }
    onNext();
  };

  const canContinue =
    formData.name.trim().length > 0 && selectedModules.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Dados da Empresa</CardTitle>
            <CardDescription>
              Informações básicas sobre sua empresa
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Razão Social <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ex: CompSmart Tecnologia Ltda"
            value={formData.name}
            onChange={(e) => onUpdate({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fantasy_name">Nome Fantasia</Label>
          <Input
            id="fantasy_name"
            placeholder="Ex: CompSmart"
            value={formData.fantasy_name}
            onChange={(e) => onUpdate({ ...formData, fantasy_name: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Como sua empresa é conhecida no mercado
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            placeholder="00.000.000/0000-00"
            value={formData.cnpj}
            onChange={handleCNPJChange}
            maxLength={18}
          />
        </div>

        {/* Módulos / Serviços */}
        <div className="space-y-3 pt-2">
          <div>
            <Label className="text-base font-semibold">
              Módulos / Serviços <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Selecione os módulos que sua empresa terá acesso. Você pode combinar quantos quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isSelected = selectedModules.includes(mod.key);
              return (
                <button
                  type="button"
                  key={mod.key}
                  onClick={() => toggleModule(mod.key)}
                  aria-pressed={isSelected}
                  className={`relative text-left rounded-lg border-2 p-4 min-h-[140px] transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isSelected
                      ? `${mod.accent} ring-2`
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="absolute top-3 right-3">
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                  </div>
                  <div className={`inline-flex p-2 rounded-md ${mod.iconWrap} mb-2`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-sm">{mod.title}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {mod.description}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedModules.length > 0 && (
            <div className="bg-muted/50 border rounded-md p-3 text-xs">
              <span className="font-medium">Selecionados:</span>{" "}
              {selectedModules.join(" + ")}
              <span className="text-muted-foreground">
                {" "}
                — incluídos no plano contratado na próxima etapa.
              </span>
            </div>
          )}

          {/* Add-ons opcionais (independentes do plano) */}
          <div className="space-y-2 pt-1">
            <Label className="text-sm font-semibold">Módulos opcionais (add-ons)</Label>
            <p className="text-xs text-muted-foreground">
              Contrate de forma independente do plano. Podem ser ativados ou desativados a qualquer momento em Configurações &gt; Meu Plano.
            </p>

            {/* NR-1 Add-on */}
            <div className="rounded-lg border-2 border-dashed p-4 flex items-start gap-3 bg-card">
              <div className="p-2 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">NR-1 (Saúde Mental & Bem-Estar)</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      Conformidade com a Portaria MTE 1.419/2024 (diagnóstico, planos de ação, clima e biblioteca).
                    </p>
                  </div>
                  <Switch
                    checked={!!formData.nr1_addon_enabled}
                    onCheckedChange={(checked) =>
                      onUpdate({ ...formData, nr1_addon_enabled: checked })
                    }
                    aria-label="Ativar módulo NR-1"
                  />
                </div>
              </div>
            </div>

            {/* Clima Organizacional Add-on */}
            <div className="rounded-lg border-2 border-dashed p-4 flex items-start gap-3 bg-card">
              <div className="p-2 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">Clima Organizacional</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      Pesquisas de clima recorrentes, eNPS, segmentação por área/unidade e relatórios — disponível em qualquer plano.
                    </p>
                  </div>
                  <Switch
                    checked={!!formData.clima_addon_enabled}
                    onCheckedChange={(checked) =>
                      onUpdate({ ...formData, clima_addon_enabled: checked })
                    }
                    aria-label="Ativar módulo Clima Organizacional"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Textarea
            id="address"
            placeholder="Endereço completo da empresa"
            value={formData.address}
            onChange={(e) => onUpdate({ ...formData, address: e.target.value })}
            rows={3}
          />
        </div>

        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full gap-2"
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
