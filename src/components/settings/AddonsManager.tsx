import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Activity, Loader2, Puzzle, Smile, Network, HeartPulse } from "lucide-react";
import { toast } from "sonner";

type AddonKey = "nr1_addon_enabled" | "clima_addon_enabled" | "fib_addon_enabled" | "psicossociais_addon_enabled" | "checkup_addon_enabled";

interface AddonsManagerProps {
  /** ID da empresa (organizational_structure.id) cujo add-ons serão geridos */
  companyId: string;
  /** Se true, o usuário pode alterar; senão exibe somente leitura */
  canEdit?: boolean;
  /** Variante compacta (sem Card externo) */
  embedded?: boolean;
}

const ADDONS: Array<{
  key: AddonKey;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    key: "nr1_addon_enabled",
    title: "NR-1 (Saúde Mental & Bem-Estar)",
    description:
      "Conformidade com a Portaria MTE 1.419/2024: diagnóstico, planos de ação, clima e biblioteca.",
    icon: ShieldCheck,
    accent: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
  {
    key: "clima_addon_enabled",
    title: "Clima Organizacional",
    description:
      "Pesquisas de clima recorrentes, eNPS, segmentação por área/unidade e relatórios.",
    icon: Activity,
    accent: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  },
  {
    key: "fib_addon_enabled",
    title: "FIB — Felicidade Interna Bruta",
    description:
      "Indicador de bem-estar e satisfação geral dos colaboradores, com tendências e benchmarks.",
    icon: Smile,
    accent: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    key: "psicossociais_addon_enabled",
    title: "Cruzamento de Riscos Psicossociais",
    description:
      "Correlação entre clima organizacional e riscos psicossociais (COPSOQ-III) para diagnóstico avançado.",
    icon: Network,
    accent: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    key: "checkup_addon_enabled",
    title: "Check-up de Colaborador",
    description:
      "Acompanhamento contínuo de bem-estar com jornadas, check-ins e alertas preventivos.",
    icon: HeartPulse,
    accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
];

export function AddonsManager({ companyId, canEdit = true, embedded = false }: AddonsManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<AddonKey | null>(null);
  const [values, setValues] = useState<Record<AddonKey, boolean>>({
    nr1_addon_enabled: false,
    clima_addon_enabled: false,
    fib_addon_enabled: false,
    psicossociais_addon_enabled: false,
    checkup_addon_enabled: false,
  });

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("organizational_structure")
        .select("nr1_addon_enabled, clima_addon_enabled, fib_addon_enabled, psicossociais_addon_enabled, checkup_addon_enabled")
        .eq("id", companyId)
        .maybeSingle();
      if (!error && data) {
        setValues({
          nr1_addon_enabled: !!(data as any).nr1_addon_enabled,
          clima_addon_enabled: !!(data as any).clima_addon_enabled,
          fib_addon_enabled: !!(data as any).fib_addon_enabled,
          psicossociais_addon_enabled: !!(data as any).psicossociais_addon_enabled,
          checkup_addon_enabled: !!(data as any).checkup_addon_enabled,
        });
      }
      setLoading(false);
    })();
  }, [companyId]);

  const toggle = async (key: AddonKey, checked: boolean) => {
    if (!canEdit) return;
    setSaving(key);
    const prev = values[key];
    setValues((v) => ({ ...v, [key]: checked }));
    const { error } = await supabase
      .from("organizational_structure")
      .update({ [key]: checked } as any)
      .eq("id", companyId);
    setSaving(null);
    if (error) {
      setValues((v) => ({ ...v, [key]: prev }));
      toast.error("Não foi possível atualizar o add-on: " + error.message);
      return;
    }
    toast.success(checked ? "Add-on ativado" : "Add-on desativado");
  };

  const content = (
    <div className="space-y-3">
      {ADDONS.map((a) => {
        const Icon = a.icon;
        const isOn = values[a.key];
        return (
          <div
            key={a.key}
            className="rounded-lg border p-4 flex items-start gap-3 bg-card"
          >
            <div className={`p-2 rounded-md ${a.accent}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {a.title}
                    {isOn && (
                      <Badge variant="secondary" className="text-[10px]">
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {a.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {saving === a.key && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  <Switch
                    checked={isOn}
                    disabled={!canEdit || loading || saving === a.key}
                    onCheckedChange={(c) => toggle(a.key, c)}
                    aria-label={`Ativar ${a.title}`}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {!canEdit && (
        <p className="text-xs text-muted-foreground">
          Você não tem permissão para alterar add-ons. Solicite ao administrador da empresa.
        </p>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Puzzle className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base">Módulos opcionais (add-ons)</CardTitle>
            <CardDescription>
              Contrate de forma independente do plano. Ative ou desative a qualquer momento.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
