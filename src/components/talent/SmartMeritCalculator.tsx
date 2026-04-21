import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSmartMerit, type SmartMeritResult } from '@/hooks/useSmartMerit';
import { Calculator, AlertTriangle, CheckCircle2, Ban } from 'lucide-react';

export const SmartMeritCalculator = () => {
  const [boxPos, setBoxPos] = useState(5);
  const [compaRatio, setCompaRatio] = useState(1.0);
  const [months, setMonths] = useState(12);
  const [budget, setBudget] = useState(100);
  const [result, setResult] = useState<SmartMeritResult | null>(null);
  const calc = useSmartMerit();

  const run = async () => {
    const r = await calc.mutateAsync({
      box_position: boxPos,
      compa_ratio: compaRatio,
      months_since_last_raise: months,
      budget_available_pct: budget,
    });
    setResult(r);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Mérito Inteligente
        </CardTitle>
        <CardDescription>
          Recomendação ajustada por compa-ratio, tempo desde último aumento e orçamento disponível.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Posição 9Box (1-9)</Label>
            <Input type="number" min={1} max={9} value={boxPos} onChange={e => setBoxPos(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Compa-ratio</Label>
            <Input type="number" step="0.01" value={compaRatio} onChange={e => setCompaRatio(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Meses último aumento</Label>
            <Input type="number" value={months} onChange={e => setMonths(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Orçamento disponível (%)</Label>
            <Input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} />
          </div>
        </div>

        <Button onClick={run} disabled={calc.isPending} className="w-full">
          {calc.isPending ? 'Calculando...' : 'Calcular Recomendação Ajustada'}
        </Button>

        {result && (
          <div className="space-y-3 pt-2 border-t">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Base 9Box</div>
                <div className="text-2xl font-bold">{result.base_pct}%</div>
              </div>
              <div className={`p-3 rounded-lg ${result.is_blocked ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <div className="text-xs text-muted-foreground">Recomendação Final</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {result.adjusted_pct}%
                  {result.is_blocked ? (
                    <Ban className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Compa: ×{result.compa_factor}</Badge>
              <Badge variant="outline">Tempo: ×{result.time_factor}</Badge>
              <Badge variant="outline">Budget: ×{result.budget_factor}</Badge>
            </div>

            {result.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-0.5">
                    {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
