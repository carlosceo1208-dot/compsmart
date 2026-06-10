import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Check, Sparkles, MessageSquare, CreditCard, ShieldCheck } from 'lucide-react';
import { NR1_TIERS, formatBRL0, type Nr1Tier } from '@/lib/nr1Pricing';
import { useNr1Plans, findNr1PlanIdByTier } from '@/hooks/useNr1Plans';

// Os 12 módulos do NR-1 — exatamente os mesmos serviços oferecidos em todas as faixas.
// Espelha os 12 mini-cards (em verde) do hub "Saúde Mental & Bem-Estar".
const NR1_FEATURES_ALL: { label: string; desc: string }[] = [
  { label: 'Visão Geral', desc: 'Painel executivo consolidado do risco psicossocial' },
  { label: 'Universo', desc: 'Mapeamento de colaboradores elegíveis e cobertura' },
  { label: 'Matriz de Risco', desc: 'Heatmap das 6 dimensões COPSOQ-III por área' },
  { label: 'Segurança Psicológica', desc: 'Indicadores de confiança e ambiente psicossocial' },
  { label: 'Sociodemográfico', desc: 'Cortes por gênero, faixa etária, tempo de casa' },
  { label: 'Etapas', desc: 'Fluxo guiado do ciclo NR-1 ponta a ponta' },
  { label: 'Novo Diagnóstico', desc: 'Aplicação do questionário COPSOQ-III (anônimo, LGPD)' },
  { label: 'Histórico', desc: 'Comparativo entre ciclos e evolução temporal' },
  { label: 'Plano de Ação', desc: 'Kanban com responsáveis, prazos e evidências' },
  { label: 'Gestão de Terceiros', desc: 'PGR estendido à cadeia de prestadores' },
  { label: 'Vitalidade', desc: 'Acompanhamento de bem-estar e jornada do colaborador' },
  { label: 'Inteligência', desc: 'IA que correlaciona NR-1 × 9Box × Clima × Remuneração' },
];

interface Props {
  onContratar: () => void;
}

function findTierByColab(n: number): Nr1Tier {
  return (
    NR1_TIERS.find((t) => n >= t.minColab && (t.maxColab == null || n <= t.maxColab)) ??
    NR1_TIERS[NR1_TIERS.length - 1]
  );
}

export default function Nr1PricingCards({ onContratar }: Props) {
  const [anual, setAnual] = useState(true);
  const [colab, setColab] = useState(120);
  const navigate = useNavigate();
  const { data: plans } = useNr1Plans();

  const selectedTier = useMemo(() => findTierByColab(colab), [colab]);

  const handleSelect = (tier: Nr1Tier) => {
    if (tier.custom) {
      onContratar();
      return;
    }
    const planId = findNr1PlanIdByTier(plans, tier.id);
    if (!planId) {
      onContratar();
      return;
    }
    navigate(`/checkout?plan=${planId}&cycle=${anual ? 'annual' : 'monthly'}&method=pix`);
  };

  const priceFor = (tier: Nr1Tier) => {
    if (tier.monthlyPrice == null) return null;
    return anual ? Math.round(tier.monthlyPrice * 0.9) : tier.monthlyPrice;
  };

  return (
    <section id="planos" className="container mx-auto px-4 py-14">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <Badge className="nr1-bg-primary text-white border-0 mb-3">Planos NR-1</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Conformidade NR-1 a <span className="nr1-text-primary">R$ 5,00 por colaborador</span>
        </h2>
        <p className="text-muted-foreground">
          Todos os planos entregam <strong>exatamente as mesmas funcionalidades</strong>.
          O que muda é apenas o volume de colaboradores — escolha a faixa que cabe na sua empresa.
        </p>

        <div className="inline-flex items-center gap-3 mt-6 px-4 py-2 rounded-full border bg-card">
          <span className={`text-sm font-medium ${!anual ? 'text-foreground' : 'text-muted-foreground'}`}>Mensal</span>
          <Switch checked={anual} onCheckedChange={setAnual} />
          <span className={`text-sm font-medium ${anual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Anual <Badge variant="outline" className="ml-1 text-[10px] text-green-600 border-green-300">-10%</Badge>
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 max-w-6xl mx-auto">
        {/* ===== Card de funcionalidades (único, vale para todos os planos) ===== */}
        <Card className="border-2 border-[hsl(var(--nr1-primary)/0.3)] relative overflow-hidden">
          <div className="absolute -top-3 left-6 z-10">
            <Badge className="nr1-bg-primary text-white border-0 gap-1 px-3">
              <Sparkles className="h-3 w-3" /> Incluso em TODAS as faixas
            </Badge>
          </div>
          <CardHeader className="pt-7">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 nr1-text-primary" />
              <CardTitle className="text-xl">O que você recebe</CardTitle>
            </div>
            <CardDescription>
              Mesmo conjunto completo de recursos da Essencial à Corporate — sem letras miúdas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {NR1_FEATURES_ALL.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 nr1-text-primary mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 p-3 rounded-lg bg-[hsl(var(--nr1-primary)/0.06)] border border-[hsl(var(--nr1-primary)/0.15)] text-xs text-muted-foreground">
              💡 Já é cliente CompSmart Pro ou Enterprise?{' '}
              <strong className="text-foreground">NR-1 Inteligente está incluso no seu plano.</strong>
            </div>
          </CardContent>
        </Card>

        {/* ===== Card de preços + seletor de faixa ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Escolha a faixa pelo nº de colaboradores</CardTitle>
            <CardDescription>
              Arraste o seletor — destacamos a faixa correspondente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Slider */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-muted-foreground">Colaboradores</span>
                <span className="text-2xl font-bold nr1-text-primary tabular-nums">
                  {colab >= 1001 ? '1.000+' : colab.toLocaleString('pt-BR')}
                </span>
              </div>
              <Slider
                value={[colab]}
                onValueChange={(v) => setColab(v[0])}
                min={10}
                max={1100}
                step={10}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>10</span>
                <span>250</span>
                <span>500</span>
                <span>750</span>
                <span>1.000+</span>
              </div>
            </div>

            {/* Tabela de faixas */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Plano</th>
                    <th className="text-left px-3 py-2 font-medium">Faixa</th>
                    <th className="text-right px-3 py-2 font-medium">{anual ? 'Anual (/mês)' : 'Mensal'}</th>
                  </tr>
                </thead>
                <tbody>
                  {NR1_TIERS.map((tier) => {
                    const price = priceFor(tier);
                    const active = tier.id === selectedTier.id;
                    return (
                      <tr
                        key={tier.id}
                        className={`border-t transition-colors ${
                          active
                            ? 'bg-[hsl(var(--nr1-primary)/0.08)] font-semibold'
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {active && <span className="h-1.5 w-1.5 rounded-full nr1-bg-primary" />}
                            <span>{tier.name}</span>
                            {tier.popular && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1 border-green-400 text-green-700">
                                Popular
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{tier.rangeLabel}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums nr1-text-primary">
                          {price == null ? 'Sob consulta' : formatBRL0(price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CTA da faixa selecionada */}
            <div className="rounded-lg border-2 border-[hsl(var(--nr1-primary))] p-4 bg-[hsl(var(--nr1-primary)/0.04)]">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">Sua faixa</div>
                  <div className="text-lg font-bold">{selectedTier.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedTier.rangeLabel}</div>
                </div>
                <div className="text-right">
                  {priceFor(selectedTier) == null ? (
                    <div className="text-xl font-bold nr1-text-primary">Sob consulta</div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold nr1-text-primary leading-tight">
                        {formatBRL0(priceFor(selectedTier)!)}
                        <span className="text-xs text-muted-foreground font-normal">/mês</span>
                      </div>
                      {anual && (
                        <div className="text-[10px] text-green-600 font-medium">
                          ~{formatBRL0(priceFor(selectedTier)! * 12)}/ano
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <Button
                className="w-full nr1-bg-primary text-white hover:opacity-90"
                onClick={() => handleSelect(selectedTier)}
              >
                {selectedTier.custom ? (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" /> Falar com especialista
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" /> Contratar {selectedTier.name}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
