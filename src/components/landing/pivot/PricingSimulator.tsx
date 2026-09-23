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
import { Loader2 } from "lucide-react";

/** Mini-simulação: módulos + colaboradores + ciclo → total mensal (valores do banco). */
export const PricingSimulator = () => {
  const { data: pricing, isLoading } = usePublicPricing();
  const [modules, setModules] = useState(3);
  const [employees, setEmployees] = useState(100);
  const [cycle, setCycle] = useState<BillingCycle>("mensal");

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  if (!pricing) return null;

  const maxModules = Math.max(1, pricing.modulos.length || 9);
  const sim = simulateMonthlyTotal(pricing, modules, employees, cycle);

  return (
    <Card className="rounded-2xl border-primary/20">
      <CardContent className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
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
              <p className="text-xs text-[#16A34A] font-medium">
                {sim.discountPct}% de desconto já aplicado ({formatBRL(sim.gross)}{" "}
                sem desconto)
              </p>
            )}
          </div>
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
