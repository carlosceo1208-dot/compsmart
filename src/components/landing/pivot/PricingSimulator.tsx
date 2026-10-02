import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePublicPricing,
  simulateMonthlyTotal,
  formatBRL,
  type BillingCycle,
} from "@/hooks/usePublicPricing";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface PricingSimulatorProps {
  /** Home: escolhe módulos um a um (com agente) e mostra "Sob consulta" em falha. */
  selectModules?: boolean;
  /** Botões de conversão exibidos abaixo do total (opcional; /precos não usa). */
  actions?: ReactNode;
}

/** Mini-simulação: módulos + colaboradores + ciclo → total mensal (valores do banco). */
export const PricingSimulator = ({ selectModules = false, actions }: PricingSimulatorProps = {}) => {
  const { data: pricing, isLoading, isError } = usePublicPricing();
  const [modules, setModules] = useState(3);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [employees, setEmployees] = useState(100);
  const [cycle, setCycle] = useState<BillingCycle>("mensal");

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-8 grid md:grid-cols-2 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </CardContent>
      </Card>
    );
  }
  if (!pricing || isError) {
    if (!selectModules) return null;
    return (
      <Card className="rounded-2xl border-primary/20">
        <CardContent className="p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Investimento mensal</p>
          <p className="text-3xl font-bold text-foreground">Sob consulta</p>
          {actions && <div className="flex flex-col sm:flex-row gap-3 justify-center">{actions}</div>}
        </CardContent>
      </Card>
    );
  }

  const selectable = pricing.modulos
    .filter((m) => !m.is_negotiable)
    .sort((a, b) => a.ordem - b.ordem);
  const chosen = selected ?? selectable.slice(0, 3).map((m) => m.slug);
  const qty = selectModules ? chosen.length : modules;
  const maxModules = Math.max(1, pricing.modulos.length || 9);
  const sim = simulateMonthlyTotal(pricing, Math.max(1, qty), employees, cycle);
  const periodMonths = cycle === "anual" ? 12 : cycle === "semestral" ? 6 : 1;
  const periodLabel = cycle === "anual" ? "Total anual" : cycle === "semestral" ? "Total semestral" : null;
  const toggle = (slug: string) =>
    setSelected(chosen.includes(slug) ? chosen.filter((s) => s !== slug) : [...chosen, slug]);

  return (
    <Card className="rounded-2xl border-primary/20">
      <CardContent className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {selectModules ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium mb-2">
                Módulos: <strong className="text-primary">{qty}</strong>
              </legend>
              {selectable.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-border p-3">
                  A lista de módulos está indisponível no momento. Fale com um especialista para simular.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectable.map((m) => (
                    <label
                      key={m.slug}
                      className="flex items-start gap-2 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50"
                    >
                      <Checkbox
                        checked={chosen.includes(m.slug)}
                        onCheckedChange={() => toggle(m.slug)}
                        className="mt-0.5"
                      />
                      <span className="text-sm leading-snug">
                        {m.nome}
                        {m.nome_agente && (
                          <span className="block text-xs text-primary">Agente {m.nome_agente}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          ) : (
          <div className="space-y-3">
            <Label>
              Módulos contratados:{" "}
              <strong className="text-primary">{modules}</strong>
            </Label>
            <Slider
              value={[modules]}
              min={1}
              max={maxModules}
              step={1}
              onValueChange={([v]) => setModules(v)}
            />
          </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sim-colab">Número de colaboradores</Label>
            <Input
              id="sim-colab"
              type="number"
              min={1}
              value={employees}
              onChange={(e) =>
                setEmployees(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Ciclo de pagamento</Label>
            <Select
              value={cycle}
              onValueChange={(v) => setCycle(v as BillingCycle)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="semestral">
                  Semestral ({pricing.desconto_semestral_pct}% off)
                </SelectItem>
                <SelectItem value="anual">
                  Anual ({pricing.desconto_anual_pct}% off)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl bg-primary/5 p-6 flex flex-col justify-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Por colaborador/mês
          </p>
          <p className="text-2xl font-bold text-foreground">
            {formatBRL(sim.perEmployee)}
          </p>
          <div className="border-t border-border pt-3 space-y-1">
            <p className="text-sm text-muted-foreground">Total mensal</p>
            <p className="text-3xl md:text-4xl font-bold text-primary">
              {formatBRL(sim.total)}
            </p>
            {sim.discountPct > 0 && (
              <p className="text-xs text-success font-medium">
                {sim.discountPct}% de desconto já aplicado ({formatBRL(sim.gross)}{" "}
                sem desconto)
              </p>
            )}
          </div>
          {periodLabel && (
            <div className="border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">{periodLabel}</p>
              <p className="text-xl font-bold text-foreground">
                {formatBRL(sim.total * periodMonths)}
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            1º módulo {formatBRL(pricing.preco_base_colaborador)} por
            colaborador/mês · do 2º em diante,{" "}
            {pricing.desconto_modulo_adicional_pct}% de desconto por módulo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
