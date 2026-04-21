import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { useBudgetScenarios, useBudgetCeilingCheck } from '@/hooks/useBudgetScenarios';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

interface Props {
  unitId: string | null;
  fiscalYear: number;
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v || 0);

const scenarioLabels: Record<string, { label: string; emoji: string; color: string }> = {
  conservador: { label: 'Conservador', emoji: '🛡️', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  realista: { label: 'Realista', emoji: '🎯', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  agressivo: { label: 'Agressivo', emoji: '🚀', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
};

const statusBadge = (status: string) => {
  switch (status) {
    case 'dentro':
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
          <CheckCircle2 className="w-3 h-3" /> Dentro do teto
        </Badge>
      );
    case 'atenção':
      return (
        <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1">
          <AlertTriangle className="w-3 h-3" /> Atenção
        </Badge>
      );
    case 'estouro':
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" /> Estouro
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const SmartBudgetScenariosCard = ({ unitId, fiscalYear }: Props) => {
  const [ceilingPct, setCeilingPct] = useState(5);
  const { data: userData } = useCurrentUserRole();
  const canView = !!userData && (userData.isAdmin || userData.isHR || userData.isSuperAdmin);

  const { data: scenarios, isLoading } = useBudgetScenarios(unitId, fiscalYear, canView);
  const { data: ceilingChecks } = useBudgetCeilingCheck(unitId, fiscalYear, ceilingPct, canView);

  if (!canView) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="w-4 h-4 text-muted-foreground" />
            Orçamento Inteligente
          </CardTitle>
          <CardDescription>
            Disponível apenas para Administradores e RH.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-primary" />
              Orçamento Inteligente — Cenários de Mérito
            </CardTitle>
            <CardDescription>
              Projeção do impacto na folha com base em performance + posição na faixa
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 min-w-[260px]">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Teto: <strong>{ceilingPct.toFixed(1)}%</strong>
            </span>
            <Slider
              value={[ceilingPct]}
              onValueChange={(v) => setCeilingPct(v[0])}
              min={1}
              max={15}
              step={0.5}
              className="w-32"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        ) : !scenarios?.length ? (
          <p className="text-sm text-muted-foreground">
            Sem dados de performance/salário para projetar cenários.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((s) => {
              const meta = scenarioLabels[s.scenario] || {
                label: s.scenario,
                emoji: '📊',
                color: 'bg-muted',
              };
              const ceiling = ceilingChecks?.find((c) => c.scenario === s.scenario);
              return (
                <div
                  key={s.scenario}
                  className="rounded-lg border p-4 space-y-3 bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.emoji}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    {ceiling && statusBadge(ceiling.status)}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Aumento da folha</span>
                      <span className="text-lg font-bold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        {s.payroll_increase_pct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground">Mérito médio</span>
                      <span className="font-medium">{s.avg_merit_pct.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground">Impacto mensal</span>
                      <span className="font-medium">{formatBRL(s.total_merit_impact_monthly)}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground">Impacto anual</span>
                      <span className="font-semibold">{formatBRL(s.total_merit_impact_annual)}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs pt-1 border-t">
                      <span className="text-muted-foreground">Colaboradores</span>
                      <span className="font-medium">{s.total_employees}</span>
                    </div>
                    {ceiling && ceiling.excess_annual > 0 && (
                      <div className="text-xs text-destructive font-medium pt-1">
                        Excesso anual: {formatBRL(ceiling.excess_annual)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
