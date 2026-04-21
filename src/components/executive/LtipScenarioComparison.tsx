import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateInstrumentScenarios, useSaveScenarioComparison } from '@/hooks/useLtipScenarios';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useToast } from '@/hooks/use-toast';
import { TrendingDown, Minus, TrendingUp, Save } from 'lucide-react';

const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const LtipScenarioComparison = () => {
  const [grant, setGrant] = useState(500000);
  const [years, setYears] = useState(4);
  const [cliff, setCliff] = useState(12);
  const [growth, setGrowth] = useState(0.10);
  const [name, setName] = useState('Cenário Executivo');

  const { data: role } = useCurrentUserRole();
  const save = useSaveScenarioComparison();
  const { toast } = useToast();

  const scenarios = useMemo(
    () =>
      calculateInstrumentScenarios({
        grant_value: grant,
        vesting_years: years,
        cliff_months: cliff,
        growth_rate: growth,
      }),
    [grant, years, cliff, growth]
  );

  const winner = useMemo(() => {
    return scenarios.reduce((best, s) => (s.base > best.base ? s : best), scenarios[0]);
  }, [scenarios]);

  const handleSave = async () => {
    if (!role?.unitId) return;
    try {
      await save.mutateAsync({
        root_company_id: role.unitId,
        comparison_name: name,
        grant_value: grant,
        vesting_years: years,
        cliff_months: cliff,
        growth_rate: growth,
        scenarios,
        recommendation: `Melhor instrumento no cenário base: ${winner.instrument} (${fmt(winner.base)})`,
      });
      toast({ title: 'Cenário salvo', description: 'Comparação registrada com sucesso.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Instrumentos LTIP — Cenários de Stress</CardTitle>
        <CardDescription>
          Compare SOP, RSU, Phantom e Partnership lado a lado nos cenários Bear / Base / Bull.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Nome do cenário</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Grant (R$)</Label>
            <Input type="number" value={grant} onChange={e => setGrant(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Vesting (anos)</Label>
            <Input type="number" value={years} onChange={e => setYears(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Crescimento base (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={growth * 100}
              onChange={e => setGrowth(Number(e.target.value) / 100)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instrumento</TableHead>
              <TableHead className="text-right">
                <TrendingDown className="h-3 w-3 inline mr-1 text-destructive" /> Bear
              </TableHead>
              <TableHead className="text-right">
                <Minus className="h-3 w-3 inline mr-1" /> Base
              </TableHead>
              <TableHead className="text-right">
                <TrendingUp className="h-3 w-3 inline mr-1 text-primary" /> Bull
              </TableHead>
              <TableHead className="text-right">Diluição</TableHead>
              <TableHead>Tributação</TableHead>
              <TableHead className="text-right">Caixa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scenarios.map(s => (
              <TableRow key={s.instrument} className={s.instrument === winner.instrument ? 'bg-primary/5' : ''}>
                <TableCell className="font-medium">
                  {s.instrument}
                  {s.instrument === winner.instrument && (
                    <Badge variant="default" className="ml-2 text-[10px]">Melhor</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-destructive">{fmt(s.bear)}</TableCell>
                <TableCell className="text-right font-mono font-bold">{fmt(s.base)}</TableCell>
                <TableCell className="text-right font-mono text-primary">{fmt(s.bull)}</TableCell>
                <TableCell className="text-right">{s.dilution_pct}%</TableCell>
                <TableCell>
                  <Badge variant={s.tax_treatment === 'mercantil' ? 'default' : 'secondary'} className="text-[10px]">
                    {s.tax_treatment === 'mercantil' ? '15%' : '27,5%'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">{s.cash_impact > 0 ? fmt(s.cash_impact) : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button onClick={handleSave} disabled={save.isPending} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {save.isPending ? 'Salvando...' : 'Salvar Comparação'}
        </Button>
      </CardContent>
    </Card>
  );
};
