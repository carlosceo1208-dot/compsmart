import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useDecisionScenarios, useBuildScenario, useCompareScenarios, useSnapshotCycle } from '@/hooks/useDecisionScenarios';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { GitCompare, Plus, Lock, TrendingUp } from 'lucide-react';
import { PlanGate } from '@/components/PlanGate';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);

const strategyPresets: Record<string, { label: string; multiplier: number; description: string }> = {
  conservative: { label: 'Conservador (60%)', multiplier: 0.6, description: 'Reduz mérito sugerido em 40%' },
  balanced: { label: 'Equilibrado (100%)', multiplier: 1.0, description: 'Aplica sugestão da matriz' },
  aggressive: { label: 'Agressivo (140%)', multiplier: 1.4, description: 'Acelera retenção de talentos' },
  top_performers_only: { label: 'Apenas Top (Box ≥ 7)', multiplier: 1.2, description: 'Foca alto desempenho' },
};

export default function DecisionScenarios() {
  const { activeCompany } = useCompanyContext();
  const fiscalYear = new Date().getFullYear();
  const { data: scenarios } = useDecisionScenarios(activeCompany?.id ?? null, fiscalYear);
  const build = useBuildScenario();
  const snapshot = useSnapshotCycle();
  const [selected, setSelected] = useState<string[]>([]);
  const compare = useCompareScenarios(selected);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ scenario_name: '', strategy: 'balanced' });

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const preset = strategyPresets[form.strategy];

  return (
    <PlanGate feature="merit_governance" title="Cenários de Decisão">
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><GitCompare className="h-7 w-7" /> Cenários de Decisão</h1>
          <p className="text-muted-foreground">Compare estratégias antes de aprovar o ciclo {fiscalYear}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo cenário</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Construir cenário a partir do 9Box</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome do cenário</Label>
                <Input value={form.scenario_name} onChange={(e) => setForm({ ...form, scenario_name: e.target.value })} placeholder="Ex: Conservador 2026" />
              </div>
              <div>
                <Label>Estratégia</Label>
                <Select value={form.strategy} onValueChange={(v) => setForm({ ...form, strategy: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(strategyPresets).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {preset && <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => build.mutate({
                root_company_id: activeCompany!.id,
                fiscal_year: fiscalYear,
                scenario_name: form.scenario_name,
                strategy: form.strategy,
                multiplier: preset.multiplier,
                filter_box_min: form.strategy === 'top_performers_only' ? 7 : null,
              }, { onSuccess: () => setOpen(false) })}>Construir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios?.map((s) => (
          <Card key={s.id} className={selected.includes(s.id) ? 'border-primary border-2' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{s.scenario_name}</CardTitle>
                  <CardDescription className="capitalize">{s.strategy} · ×{Number(s.multiplier).toFixed(2)}</CardDescription>
                </div>
                <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Headcount</span><strong>{s.total_headcount}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Impacto anual</span><strong>{fmt(Number(s.total_annual_impact))}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">% folha</span><strong>{Number(s.payroll_increase_pct).toFixed(2)}%</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">High perf retidos</span><Badge variant="secondary">{s.high_performers_retained}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Low perf incluídos</span><Badge variant="outline">{s.low_performers_included}</Badge></div>
              <Button
                size="sm" variant="outline" className="w-full mt-2"
                onClick={() => snapshot.mutate({
                  root_company_id: activeCompany!.id,
                  fiscal_year: fiscalYear,
                  cycle_name: `Ciclo ${fiscalYear}`,
                  scenario_id: s.id,
                  notes: `Cenário escolhido: ${s.scenario_name}`,
                })}
              ><Lock className="h-3 w-3 mr-1" /> Congelar como decisão</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected.length >= 2 && compare.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Comparação ({selected.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="text-left p-2">Cenário</th>
                    <th className="text-right p-2">Headcount</th>
                    <th className="text-right p-2">Impacto anual</th>
                    <th className="text-right p-2">% folha</th>
                    <th className="text-right p-2">High perf</th>
                    <th className="text-right p-2">Mérito médio</th>
                  </tr>
                </thead>
                <tbody>
                  {(compare.data as any[]).map((row) => (
                    <tr key={row.scenario_id} className="border-b">
                      <td className="p-2 font-medium">{row.scenario_name}</td>
                      <td className="p-2 text-right">{row.total_headcount}</td>
                      <td className="p-2 text-right">{fmt(Number(row.total_annual_impact))}</td>
                      <td className="p-2 text-right">{Number(row.payroll_increase_pct).toFixed(2)}%</td>
                      <td className="p-2 text-right">{row.high_performers_retained}</td>
                      <td className="p-2 text-right">{Number(row.avg_merit_pct ?? 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </PlanGate>
  );
}
