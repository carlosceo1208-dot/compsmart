import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useUnitBudgetStatus, useUpsertUnitBudget } from '@/hooks/useBudgetBurndown';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { Wallet, AlertTriangle, TrendingDown, Plus } from 'lucide-react';
import { PlanGate } from '@/components/PlanGate';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);

const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (s) {
    case 'healthy': return 'secondary';
    case 'warning': return 'outline';
    case 'critical': case 'exhausted': return 'destructive';
    default: return 'default';
  }
};

const statusLabel: Record<string, string> = {
  healthy: 'Saudável',
  warning: 'Atenção (>80%)',
  critical: 'Crítico (>95%)',
  exhausted: 'Esgotado',
  no_budget: 'Sem orçamento',
};

export default function BudgetBurndown() {
  const { activeCompany } = useCompanyContext();
  const fiscalYear = new Date().getFullYear();
  const { data: budgets, isLoading } = useUnitBudgetStatus(activeCompany?.id ?? null, fiscalYear);
  const upsert = useUpsertUnitBudget();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ unit_id: '', approved_amount_annual: 0, ceiling_pct: 5 });

  const totalApproved = budgets?.reduce((s, b) => s + Number(b.approved_amount_annual), 0) ?? 0;
  const totalConsumed = budgets?.reduce((s, b) => s + Number(b.consumed_amount), 0) ?? 0;
  const totalAvailable = budgets?.reduce((s, b) => s + Number(b.available_amount), 0) ?? 0;
  const globalBurn = totalApproved > 0 ? (totalConsumed / totalApproved) * 100 : 0;

  return (
    <PlanGate feature="merit_governance" title="Budget Burn-Down">
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Wallet className="h-7 w-7" /> Budget Burn-Down</h1>
          <p className="text-muted-foreground">Reconciliação real do orçamento de mérito por unidade</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Aprovar Orçamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo orçamento de unidade</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Unit ID</Label>
                <Input value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })} placeholder="UUID da unidade" />
              </div>
              <div>
                <Label>Valor anual aprovado (R$)</Label>
                <Input type="number" value={form.approved_amount_annual} onChange={(e) => setForm({ ...form, approved_amount_annual: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Teto (% folha)</Label>
                <Input type="number" step="0.5" value={form.ceiling_pct} onChange={(e) => setForm({ ...form, ceiling_pct: Number(e.target.value) })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => upsert.mutate({
                root_company_id: activeCompany!.id,
                unit_id: form.unit_id,
                fiscal_year: fiscalYear,
                approved_amount_annual: form.approved_amount_annual,
                ceiling_pct: form.ceiling_pct,
              }, { onSuccess: () => setOpen(false) })}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Aprovado total</CardDescription><CardTitle>{fmt(totalApproved)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Consumido</CardDescription><CardTitle className="text-warning">{fmt(totalConsumed)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Disponível</CardDescription><CardTitle className="text-success">{fmt(totalAvailable)}</CardTitle></CardHeader></Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Burn global</CardDescription><CardTitle>{globalBurn.toFixed(1)}%</CardTitle></CardHeader>
          <CardContent><Progress value={Math.min(globalBurn, 100)} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Por unidade</CardTitle></CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && (!budgets || budgets.length === 0) && (
            <p className="text-sm text-muted-foreground">Nenhum orçamento aprovado para {fiscalYear}.</p>
          )}
          <div className="space-y-3">
            {budgets?.map((b) => (
              <div key={b.unit_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold">{b.unit_name}</div>
                    <div className="text-xs text-muted-foreground">{b.ledger_count} movimentações</div>
                  </div>
                  <Badge variant={statusVariant(b.status)}>
                    {b.status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {b.status === 'exhausted' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {statusLabel[b.status]}
                  </Badge>
                </div>
                <Progress value={Math.min(Number(b.burn_pct), 100)} className="mb-2" />
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Aprovado:</span><br /><strong>{fmt(Number(b.approved_amount_annual))}</strong></div>
                  <div><span className="text-muted-foreground">Consumido:</span><br /><strong>{fmt(Number(b.consumed_amount))}</strong></div>
                  <div><span className="text-muted-foreground">Disponível:</span><br /><strong className="text-success">{fmt(Number(b.available_amount))}</strong></div>
                  <div><span className="text-muted-foreground">Burn:</span><br /><strong>{Number(b.burn_pct).toFixed(1)}%</strong></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </PlanGate>
  );
}
