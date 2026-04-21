import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, Download } from 'lucide-react';
import { useMeritSuggestion } from '@/hooks/useMeritIntelligence';
import { formatCurrency } from '@/lib/formatters';
import { exportToCSV } from '@/lib/csvExport';

interface MeritSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string | null;
  employeeName?: string;
  onApply?: (meritPercentage: number, newSalary: number) => void;
}

export function MeritSuggestionDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  onApply,
}: MeritSuggestionDialogProps) {
  const { data: suggestion, isLoading, error } = useMeritSuggestion(open ? employeeId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Sugestão de Mérito Inteligente</DialogTitle>
              <DialogDescription>
                {employeeName ? `Análise para ${employeeName}` : 'Matriz Performance × Posição na Faixa'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar sugestão</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        ) : suggestion ? (
          <div className="space-y-4 py-2">
            {/* Métricas base */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Performance</p>
                <p className="text-2xl font-bold mt-1">
                  {suggestion.performance_score?.toFixed(1) ?? '—'}
                  <span className="text-sm text-muted-foreground font-normal"> /5</span>
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Posição na Faixa</p>
                <p className="text-2xl font-bold mt-1">
                  {suggestion.range_position_percentage?.toFixed(0) ?? '—'}
                  <span className="text-sm text-muted-foreground font-normal">%</span>
                </p>
              </div>
            </div>

            {/* Alerta de incoerência */}
            {suggestion.is_mismatch && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Incoerência detectada</AlertTitle>
                <AlertDescription>{suggestion.mismatch_reason}</AlertDescription>
              </Alert>
            )}

            {/* Sugestão principal */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                  Mérito Sugerido
                </p>
              </div>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl font-bold text-primary">
                  {suggestion.suggested_merit_percentage.toFixed(1)}%
                </span>
                <Badge variant="outline" className="text-xs">
                  Matriz Mercer/Hay
                </Badge>
              </div>

              <Separator className="my-3" />

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Salário Atual</p>
                  <p className="font-semibold">{formatCurrency(suggestion.current_salary)}</p>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Novo Salário</p>
                  <p className="font-semibold text-primary">
                    {formatCurrency(suggestion.suggested_new_salary)}
                  </p>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Impacto Mensal</p>
                  <p className="font-semibold">+{formatCurrency(suggestion.monthly_impact)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Impacto Anual</p>
                  <p className="font-semibold">+{formatCurrency(suggestion.annual_impact)}</p>
                </div>
              </div>
            </div>

            {/* Recomendação */}
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Recomendação</AlertTitle>
              <AlertDescription>{suggestion.recommendation}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {suggestion && (
            <Button
              variant="outline"
              onClick={() => {
                exportToCSV(
                  `merit_suggestion_${employeeName ?? employeeId}_${new Date().toISOString().slice(0, 10)}.csv`,
                  [
                    { header: 'Funcionário', accessor: () => employeeName ?? employeeId ?? '' },
                    { header: 'Performance', accessor: () => suggestion.performance_score?.toFixed(2) ?? '' },
                    { header: '% na Faixa', accessor: () => suggestion.range_position_percentage?.toFixed(1) ?? '' },
                    { header: 'Salário Atual', accessor: () => suggestion.current_salary.toFixed(2) },
                    { header: '% Mérito Sugerido', accessor: () => suggestion.suggested_merit_percentage.toFixed(2) },
                    { header: 'Novo Salário', accessor: () => suggestion.suggested_new_salary.toFixed(2) },
                    { header: 'Impacto Mensal', accessor: () => suggestion.monthly_impact.toFixed(2) },
                    { header: 'Impacto Anual', accessor: () => suggestion.annual_impact.toFixed(2) },
                    { header: 'Recomendação', accessor: () => suggestion.recommendation },
                    { header: 'Incoerência', accessor: () => (suggestion.is_mismatch ? suggestion.mismatch_reason ?? 'Sim' : 'Não') },
                  ],
                  [suggestion],
                  ';'
                );
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          )}
          {onApply && suggestion && suggestion.suggested_merit_percentage > 0 && (
            <Button
              onClick={() => {
                onApply(suggestion.suggested_merit_percentage, suggestion.suggested_new_salary);
                onOpenChange(false);
              }}
            >
              Aplicar Sugestão
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
