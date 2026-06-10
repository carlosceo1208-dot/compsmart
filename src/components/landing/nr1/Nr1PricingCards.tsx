import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Check, Sparkles, MessageSquare, Building2, Rocket, TrendingUp, Briefcase, Crown, Shield, CreditCard } from 'lucide-react';
import { NR1_TIERS, formatBRL0, type Nr1Tier } from '@/lib/nr1Pricing';
import { useNr1Plans, findNr1PlanIdByTier } from '@/hooks/useNr1Plans';

const TIER_ICONS: Record<string, typeof Rocket> = {
  essencial: Shield,
  crescimento: Rocket,
  consolidacao: TrendingUp,
  performance: Briefcase,
  corporate: Building2,
  enterprise: Crown,
};

interface Props {
  onContratar: () => void;
}

export default function Nr1PricingCards({ onContratar }: Props) {
  const [anual, setAnual] = useState(true);
  const navigate = useNavigate();
  const { data: plans } = useNr1Plans();

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

  return (
    <section id="planos" className="container mx-auto px-4 py-14">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <Badge className="nr1-bg-primary text-white border-0 mb-3">Planos NR-1</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Conformidade NR-1 a <span className="nr1-text-primary">R$ 5,00 por colaborador</span>
        </h2>
        <p className="text-muted-foreground">
          Mensal recorrente, sem fidelidade. Faixas escalonadas conforme o porte da sua empresa —
          do diagnóstico inicial à inteligência integrada com 9Box e remuneração.
        </p>

        <div className="inline-flex items-center gap-3 mt-6 px-4 py-2 rounded-full border bg-card">
          <span className={`text-sm font-medium ${!anual ? 'text-foreground' : 'text-muted-foreground'}`}>Mensal</span>
          <Switch checked={anual} onCheckedChange={setAnual} />
          <span className={`text-sm font-medium ${anual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Anual <Badge variant="outline" className="ml-1 text-[10px] text-green-600 border-green-300">-10%</Badge>
          </span>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {NR1_TIERS.map((tier) => (
          <TierCard key={tier.id} tier={tier} anual={anual} onSelect={() => handleSelect(tier)} />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        💡 Já é cliente CompSmart Pro ou Enterprise? <strong>NR-1 Inteligente está incluso no seu plano.</strong>
      </p>
    </section>
  );
}

function TierCard({ tier, anual, onSelect }: { tier: Nr1Tier; anual: boolean; onSelect: () => void }) {
  const Icon = TIER_ICONS[tier.id] ?? Shield;

  const monthly = tier.monthlyPrice;
  const displayPrice = monthly == null ? null : anual ? Math.round(monthly * 0.9) : monthly;

  return (
    <Card
      className={`relative flex flex-col ${
        tier.popular
          ? 'border-2 border-[hsl(var(--nr1-primary))] shadow-lg'
          : tier.custom
            ? 'border-2 border-dashed border-[hsl(var(--nr1-primary)/0.4)]'
            : 'border'
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="nr1-bg-primary text-white border-0 gap-1 px-3">
            <Sparkles className="h-3 w-3" /> Mais Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Icon className="h-5 w-5 nr1-text-primary" />
          {tier.custom && (
            <Badge variant="outline" className="text-[10px] nr1-text-primary border-[hsl(var(--nr1-primary)/0.4)]">
              Sob consulta
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-2">{tier.name}</CardTitle>
        <CardDescription className="text-xs">{tier.rangeLabel}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="mb-4">
          {displayPrice == null ? (
            <>
              <div className="text-2xl font-bold nr1-text-primary leading-tight">Sob consulta</div>
              <p className="text-[11px] text-muted-foreground mt-1">{tier.perColabLabel}</p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold nr1-text-primary">{formatBRL0(displayPrice)}</span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </div>
              {anual && (
                <p className="text-[10px] text-green-600 font-medium mt-0.5">
                  ~{formatBRL0(displayPrice * 12)}/ano
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">{tier.perColabLabel}</p>
            </>
          )}
        </div>

        <ul className="space-y-1.5 mb-4 flex-1">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-1.5 text-xs">
              <Check className="h-3.5 w-3.5 nr1-text-primary mt-0.5 flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <Button
          size="sm"
          className={`w-full ${tier.popular ? 'nr1-bg-primary text-white' : ''}`}
          variant={tier.popular ? 'default' : 'outline'}
          onClick={onSelect}
        >
          {tier.custom ? (
            <>
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Falar com especialista
            </>
          ) : (
            <>
              <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Contratar
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
