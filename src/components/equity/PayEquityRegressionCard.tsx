import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePayEquityRegressions, useRunRegressionAnalysis } from '@/hooks/usePayEquityRegression';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Activity, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const severityColor: Record<string, string> = {
  none: 'bg-muted text-muted-foreground',
  low: 'bg-blue-500/15 text-blue-700',
  medium: 'bg-yellow-500/15 text-yellow-700',
  high: 'bg-orange-500/15 text-orange-700',
  critical: 'bg-destructive/15 text-destructive',
};

export const PayEquityRegressionCard = () => {
  const { data: role } = useCurrentUserRole();
  const { data: results, isLoading } = usePayEquityRegressions();
  const run = useRunRegressionAnalysis();
  const { toast } = useToast();

  const [attr, setAttr] = useState<'gender' | 'race'>('gender');
  const [groupA, setGroupA] = useState('M');
  const [groupB, setGroupB] = useState('F');

  const handleRun = async () => {
    if (!role?.unitId) {
      toast({ title: 'Erro', description: 'Unidade não encontrada', variant: 'destructive' });
      return;
    }
    try {
      await run.mutateAsync({
        root_company_id: role.unitId,
        protected_attribute: attr,
        group_a_label: groupA,
        group_b_label: groupB,
      });
      toast({ title: 'Análise concluída', description: 'Resultado registrado no histórico.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Análise de Regressão (Gap Explicado vs Não-Explicado)
        </CardTitle>
        <CardDescription>
          Decompõe o gap salarial em parte explicável (tempo de casa, mix de cargos) e parte não-explicável — base auditável para LGPD/ESG.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Atributo</Label>
            <Select value={attr} onValueChange={(v: any) => setAttr(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gender">Gênero</SelectItem>
                <SelectItem value="race">Raça</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Grupo A (referência)</Label>
            <Input value={groupA} onChange={e => setGroupA(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Grupo B (comparação)</Label>
            <Input value={groupB} onChange={e => setGroupB(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleRun} disabled={run.isPending} className="w-full">
              {run.isPending ? 'Analisando...' : 'Rodar Análise'}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando histórico...</div>
        ) : results && results.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Atributo</TableHead>
                <TableHead>Grupos</TableHead>
                <TableHead className="text-right">Gap bruto</TableHead>
                <TableHead className="text-right">Explicado</TableHead>
                <TableHead className="text-right">Não-explicado</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead className="text-right">N</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.analysis_date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><Badge variant="outline">{r.protected_attribute}</Badge></TableCell>
                  <TableCell className="text-xs">{r.group_a_label} vs {r.group_b_label}</TableCell>
                  <TableCell className="text-right font-mono">{r.raw_gap_pct.toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{r.explained_gap_pct.toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono font-bold">{r.unexplained_gap_pct.toFixed(2)}%</TableCell>
                  <TableCell>
                    <Badge className={severityColor[r.severity]}>
                      {r.severity === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {r.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs">{r.sample_size}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            Nenhuma análise realizada ainda.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
