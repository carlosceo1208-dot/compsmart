import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Sparkles, ArrowRight, Calendar, Banknote, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { NR1_TIERS, formatBRL0 } from '@/lib/nr1Pricing';
import { useNr1Plans, findNr1PlanIdByTier } from '@/hooks/useNr1Plans';

const ANNUAL_DISCOUNT = 0.10;
const PIX_DISCOUNT = 0.05;

interface Props {
  onCTA: () => void;
}

export default function Nr1DiscountSimulator({ onCTA }: Props) {
  const navigate = useNavigate();
  const { data: dbPlans } = useNr1Plans();
  const billable = NR1_TIERS.filter((t) => t.monthlyPrice != null);
  const [selected, setSelected] = useState<string>(billable[1]?.id || billable[0].id);
  const [anual, setAnual] = useState(true);
  const [pix, setPix] = useState(false);

  const tier = useMemo(() => billable.find((t) => t.id === selected) || billable[0], [selected, billable]);

  const calc = useMemo(() => {
    const base = tier.monthlyPrice!;
    const months = anual ? 12 : 1;
    let total = base * months;
    const original = total;
    const discounts: { name: string; value: number }[] = [];

    if (anual) {
      const v = total * ANNUAL_DISCOUNT;
      discounts.push({ name: 'Plano Anual (10%)', value: v });
      total *= 1 - ANNUAL_DISCOUNT;
    }
    if (pix) {
      const v = total * PIX_DISCOUNT;
      discounts.push({ name: 'Pagamento via PIX (5%)', value: v });
      total *= 1 - PIX_DISCOUNT;
    }

    const savings = original - total;
    const pct = (savings / original) * 100;
    const monthlyEq = anual ? total / 12 : total;

    return {
      original,
      final: Math.round(total),
      discounts,
      savings: Math.round(savings),
      pct,
      monthlyEq: Math.round(monthlyEq),
      period: anual ? 'ano' : 'mês',
    };
  }, [tier, anual, pix]);

  const maxed = anual && pix;

  return (
    <Card className="max-w-3xl mx-auto border-2 border-[hsl(var(--nr1-primary)/0.3)] bg-gradient-to-br from-[hsl(var(--nr1-primary)/0.05)] via-background to-[hsl(var(--nr1-primary)/0.05)]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 rounded-lg bg-[hsl(var(--nr1-primary)/0.1)]">
            <Calculator className="h-5 w-5 nr1-text-primary" />
          </div>
          Simule seu Desconto NR-1
          {maxed && (
            <Badge className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 animate-pulse">
              <Sparkles className="h-3 w-3 mr-1" /> Máximo!
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Escolha o plano base:</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {billable.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  selected === t.id
                    ? 'border-[hsl(var(--nr1-primary))] bg-[hsl(var(--nr1-primary)/0.1)] shadow-md'
                    : 'border-border hover:border-[hsl(var(--nr1-primary)/0.5)]'
                }`}
              >
                <span className="font-semibold text-xs block">{t.name}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatBRL0(t.monthlyPrice!)}/mês</p>
              </button>
            ))}
          </div>
        </div>

        {/* Discounts */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Selecione os descontos aplicáveis:</label>
          <div className="space-y-2">
            <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${anual ? 'bg-violet-500/10 border-violet-500/30' : 'border-border'}`}>
              <div className="flex items-center gap-3">
                <Checkbox id="nr1-anual" checked={anual} onCheckedChange={(c) => setAnual(!!c)} />
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  <label htmlFor="nr1-anual" className="text-sm font-medium cursor-pointer">
                    Plano Anual (cobrança única)
                  </label>
                </div>
              </div>
              <Badge variant="outline" className="text-violet-600 border-violet-300">-10%</Badge>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${pix ? 'bg-green-500/10 border-green-500/30' : 'border-border'}`}>
              <div className="flex items-center gap-3">
                <Checkbox id="nr1-pix" checked={pix} onCheckedChange={(c) => setPix(!!c)} />
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-500" />
                  <label htmlFor="nr1-pix" className="text-sm font-medium cursor-pointer">
                    Pagamento via PIX
                  </label>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-300">-5%</Badge>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-muted/80 to-muted border space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <CreditCard className="h-4 w-4" /> Resultado da Simulação
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço original:</span>
              <span>{formatBRL0(calc.original)}/{calc.period}</span>
            </div>
            {calc.discounts.map((d, i) => (
              <div key={i} className="flex justify-between text-green-600 dark:text-green-400">
                <span>{d.name}:</span>
                <span>- {formatBRL0(Math.round(d.value))}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Valor Final:</span>
              <span className="nr1-text-primary">
                {formatBRL0(calc.final)}/{calc.period}
                {maxed && <Sparkles className="inline h-4 w-4 ml-1 text-amber-500" />}
              </span>
            </div>
            {anual && (
              <p className="text-xs text-muted-foreground text-right">≈ {formatBRL0(calc.monthlyEq)}/mês</p>
            )}
          </div>
          {calc.savings > 0 && (
            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <Sparkles className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                Economia total: {formatBRL0(calc.savings)} ({calc.pct.toFixed(1)}% de desconto)
              </span>
            </div>
          )}
        </div>

        <Button
          className="w-full nr1-bg-primary text-white group"
          size="lg"
          onClick={() => {
            const planId = findNr1PlanIdByTier(dbPlans, tier.id);
            if (!planId) { onCTA(); return; }
            const method = pix ? 'pix' : 'credit_card';
            navigate(`/checkout?plan=${planId}&cycle=${anual ? 'annual' : 'monthly'}&method=${method}`);
          }}
        >
          Solicitar proposta {tier.name}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
