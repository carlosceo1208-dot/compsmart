import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calculator, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { use9BoxBudgetSimulation, type BudgetSimRow } from '@/hooks/useTalentApproval';
import { useCompanyContext } from '@/contexts/CompanyContext';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const statusStyle: Record<BudgetSimRow['status'], string> = {
  dentro: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
  'atenção': 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
  estouro: 'bg-destructive/10 text-destructive border-destructive/30',
  'sem dados': 'bg-muted text-muted-foreground',
};

export function NineBoxBudgetSimulator() {
  const { activeCompanyId } = useCompanyContext();
  const [ceiling, setCeiling] = useState(5);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());

  const { data, isLoading } = use9BoxBudgetSimulation(
    activeCompanyId,
    fiscalYear,
    ceiling
  );

  const totals = (data ?? []).reduce(
    (acc, r) => ({
      payroll: acc.payroll + Number(r.current_payroll_annual),
      impact: acc.impact + Number(r.proposed_merit_impact_annual),
      ceiling: acc.ceiling + Number(r.ceiling_amount_annual),
      excess: acc.excess + Number(r.excess_annual),
      headcount: acc.headcount + r.headcount,
    }),
    { payroll: 0, impact: 0, ceiling: 0, excess: 0, headcount: 0 }
  );

  const overallPct = totals.payroll > 0 ? (totals.impact / totals.payroll) * 100 : 0;
  const unitsOverCeiling = (data ?? []).filter((r) => r.status === 'estouro').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Simulador 9Box × Orçamento</CardTitle>
            <CardDescription>
              Compare o impacto anual das recomendações com o teto de mérito
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ceiling">Teto de mérito (% folha)</Label>
            <Input
              id="ceiling"
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={ceiling}
              onChange={(e) => setCeiling(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="fy">Ano fiscal</Label>
            <Input
              id="fy"
              type="number"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(parseInt(e.target.value) || new Date().getFullYear())}
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <KpiTile icon={<Users className="h-4 w-4" />} label="Funcionários" value={String(totals.headcount)} />
          <KpiTile
            icon={<TrendingUp className="h-4 w-4" />}
            label="% sobre folha"
            value={`${overallPct.toFixed(2)}%`}
            tone={overallPct > ceiling ? 'destructive' : overallPct > ceiling * 0.85 ? 'warn' : 'ok'}
          />
          <KpiTile label="Impacto anual" value={formatBRL(totals.impact)} />
          <KpiTile
            label="Excesso"
            value={formatBRL(totals.excess)}
            tone={totals.excess > 0 ? 'destructive' : 'ok'}
          />
        </div>

        {/* Alerta global */}
        {unitsOverCeiling > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{unitsOverCeiling} unidade(s) acima do teto</AlertTitle>
            <AlertDescription>
              As propostas do 9Box excedem o limite de {ceiling}% da folha em{' '}
              {unitsOverCeiling} área(s). Revise as recomendações ou negocie aumento de teto.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabela por unidade */}
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !data || data.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhuma recomendação ativa do 9Box para simular.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  <TableHead className="text-right">Headcount</TableHead>
                  <TableHead className="text-right">Folha anual</TableHead>
                  <TableHead className="text-right">Impacto anual</TableHead>
                  <TableHead className="text-right">% folha</TableHead>
                  <TableHead className="text-right">Teto (R$)</TableHead>
                  <TableHead className="text-right">Excesso</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r) => (
                  <TableRow key={r.unit_id}>
                    <TableCell className="font-medium">
                      {r.unit_name}
                      <div className="text-[10px] text-muted-foreground">
                        ★ {r.high_performers} · ▽ {r.low_performers}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{r.headcount}</TableCell>
                    <TableCell className="text-right">{formatBRL(r.current_payroll_annual)}</TableCell>
                    <TableCell className="text-right">{formatBRL(r.proposed_merit_impact_annual)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(r.payroll_increase_pct).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatBRL(r.ceiling_amount_annual)}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.excess_annual > 0 ? (
                        <span className="text-destructive font-semibold">
                          +{formatBRL(r.excess_annual)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyle[r.status]}>
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KpiTile({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: 'neutral' | 'ok' | 'warn' | 'destructive';
}) {
  const toneClass =
    tone === 'destructive'
      ? 'text-destructive'
      : tone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : tone === 'ok'
      ? 'text-emerald-600 dark:text-emerald-400'
      : '';
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`text-lg font-bold mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}
