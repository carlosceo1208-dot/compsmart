import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Briefcase, Plus, Trash2, Calculator } from 'lucide-react';
import {
  useLtipSimulations,
  useCreateLtipSimulation,
  useDeleteLtipSimulation,
  calculateLtipProjection,
  INSTRUMENT_LABELS,
  InstrumentType,
  SimulationInput,
} from '@/hooks/useExecutiveCompensation';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { LtipScenarioComparison } from '@/components/executive/LtipScenarioComparison';

const formatBRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0));

export default function ExecutiveCompensation() {
  const { data: role } = useCurrentUserRole();
  const allowed = role?.isAdmin || role?.isSuperAdmin;
  const [open, setOpen] = useState(false);
  const { data: sims = [], isLoading } = useLtipSimulations();
  const createMut = useCreateLtipSimulation();
  const deleteMut = useDeleteLtipSimulation();

  if (!allowed) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Acesso restrito a Admin/Super Admin (dados confidenciais).
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 h-[calc(100vh-8rem)] overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            Executive Compensation
          </h1>
          <p className="text-sm text-muted-foreground">
            Simulador de ILP — Stock Options, RSU, Phantom, Partnership, Previdência
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Simulação
            </Button>
          </DialogTrigger>
          <SimulationForm onClose={() => setOpen(false)} onSubmit={(input) => createMut.mutate(input, { onSuccess: () => setOpen(false) })} />
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulações Salvas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">Carregando...</div>
          ) : sims.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              Nenhuma simulação. Clique em "Nova Simulação".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cenário</TableHead>
                    <TableHead>Instrumento</TableHead>
                    <TableHead className="text-right">Vesting</TableHead>
                    <TableHead className="text-right">Valor no Vest</TableHead>
                    <TableHead className="text-right">Diluição</TableHead>
                    <TableHead className="text-right">Imp. Fiscal</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sims.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.scenario_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{INSTRUMENT_LABELS[s.instrument_type as InstrumentType]}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {s.vesting_years}a · cliff {s.cliff_months}m
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatBRL(s.total_value_at_vest)}</TableCell>
                      <TableCell className="text-right text-xs">
                        {s.dilution_percentage ? `${Number(s.dilution_percentage).toFixed(3)}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatBRL(s.tax_impact_estimated)}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate(s.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SimulationForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: SimulationInput) => void;
}) {
  const [form, setForm] = useState<SimulationInput>({
    scenario_name: '',
    instrument_type: 'stock_options',
    grant_value: 0,
    vesting_years: 4,
    cliff_months: 12,
    vesting_type: 'linear',
    projected_growth_rate: 10,
    current_share_price: 10,
    exercise_price: 10,
    num_shares: 1000,
  });

  const preview = calculateLtipProjection(form);
  const set = <K extends keyof SimulationInput>(k: K, v: SimulationInput[K]) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" /> Nova Simulação ILP
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Nome do cenário</Label>
            <Input value={form.scenario_name} onChange={(e) => set('scenario_name', e.target.value)} placeholder="Ex: CEO 2026 - Cenário base" />
          </div>

          <div>
            <Label>Instrumento</Label>
            <Select value={form.instrument_type} onValueChange={(v) => set('instrument_type', v as InstrumentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(INSTRUMENT_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tributação</Label>
            <Select value={form.tax_treatment ?? 'remuneratorio'} onValueChange={(v: any) => set('tax_treatment', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mercantil">Mercantil (15%)</SelectItem>
                <SelectItem value="remuneratorio">Remuneratório (27.5%)</SelectItem>
                <SelectItem value="previdenciario">Previdenciário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.instrument_type === 'previdencia' ? (
            <>
              <div>
                <Label>Salário mensal base</Label>
                <Input type="number" value={form.grant_value} onChange={(e) => set('grant_value', Number(e.target.value))} />
              </div>
              <div>
                <Label>Contrib. funcionário (%)</Label>
                <Input type="number" value={form.employee_contribution_pct ?? 6} onChange={(e) => set('employee_contribution_pct', Number(e.target.value))} />
              </div>
              <div>
                <Label>Matching empresa (%)</Label>
                <Input type="number" value={form.matching_percentage ?? 100} onChange={(e) => set('matching_percentage', Number(e.target.value))} />
              </div>
            </>
          ) : form.instrument_type === 'bonus_diferido' ? (
            <div className="col-span-2">
              <Label>Valor do bônus</Label>
              <Input type="number" value={form.grant_value} onChange={(e) => set('grant_value', Number(e.target.value))} />
            </div>
          ) : (
            <>
              <div>
                <Label>Nº ações outorgadas</Label>
                <Input type="number" value={form.num_shares ?? 0} onChange={(e) => set('num_shares', Number(e.target.value))} />
              </div>
              <div>
                <Label>Preço atual da ação</Label>
                <Input type="number" step="0.01" value={form.current_share_price ?? 0} onChange={(e) => set('current_share_price', Number(e.target.value))} />
              </div>
              <div>
                <Label>Preço de exercício</Label>
                <Input type="number" step="0.01" value={form.exercise_price ?? 0} onChange={(e) => set('exercise_price', Number(e.target.value))} />
              </div>
              <div>
                <Label>Total ações em circulação</Label>
                <Input type="number" value={form.total_shares_outstanding ?? 0} onChange={(e) => set('total_shares_outstanding', Number(e.target.value))} />
              </div>
            </>
          )}

          <div>
            <Label>Vesting (anos)</Label>
            <Input type="number" value={form.vesting_years} onChange={(e) => set('vesting_years', Number(e.target.value))} />
          </div>
          <div>
            <Label>Cliff (meses)</Label>
            <Input type="number" value={form.cliff_months} onChange={(e) => set('cliff_months', Number(e.target.value))} />
          </div>
          <div>
            <Label>Tipo de vesting</Label>
            <Select value={form.vesting_type} onValueChange={(v: any) => set('vesting_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="progressivo">Progressivo</SelectItem>
                <SelectItem value="cliff_only">Cliff only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Crescimento projetado (% a.a.)</Label>
            <Input type="number" step="0.1" value={form.projected_growth_rate} onChange={(e) => set('projected_growth_rate', Number(e.target.value))} />
          </div>

          <div className="col-span-2">
            <Label>Notas</Label>
            <Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
          </div>
        </div>

        {/* Preview */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Valor no vest</div>
              <div className="text-lg font-bold text-primary">{formatBRL(preview.total_value_at_vest)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Imp. fiscal</div>
              <div className="text-lg font-bold text-destructive">{formatBRL(preview.tax_impact_estimated)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Líquido</div>
              <div className="text-lg font-bold text-emerald-600">{formatBRL(preview.net_value)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSubmit(form)} disabled={!form.scenario_name}>
          Salvar Simulação
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
