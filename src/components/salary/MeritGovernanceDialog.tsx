import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  useEvaluateGovernance,
  useCreateMeritRequest,
  type GateWarning,
} from '@/hooks/useMeritGovernance';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';

interface MeritGovernanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  suggestedMeritPct: number;
  performanceScore?: number | null;
  boxPosition?: number | null;
  compaRatio?: number | null;
  rangePositionPct?: number | null;
  monthsSinceLastRaise?: number | null;
  budgetAvailablePct?: number | null;
  budgetRemainingAnnual?: number | null;
  unitId?: string | null;
}

const severityColor: Record<GateWarning['severity'], string> = {
  medium: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
  high: 'bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400',
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
};

export function MeritGovernanceDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  currentSalary,
  suggestedMeritPct,
  performanceScore,
  boxPosition,
  compaRatio,
  rangePositionPct,
  monthsSinceLastRaise,
  budgetAvailablePct,
  budgetRemainingAnnual,
  unitId,
}: MeritGovernanceDialogProps) {
  const [requestedPct, setRequestedPct] = useState(suggestedMeritPct);
  const [justification, setJustification] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const evaluate = useEvaluateGovernance();
  const create = useCreateMeritRequest();

  const newSalary = useMemo(
    () => +(currentSalary * (1 + requestedPct / 100)).toFixed(2),
    [currentSalary, requestedPct]
  );
  const monthlyImpact = +(newSalary - currentSalary).toFixed(2);
  const annualImpact = +(monthlyImpact * 12).toFixed(2);

  useEffect(() => {
    if (!open) return;
    setRequestedPct(suggestedMeritPct);
    setJustification('');
    setOverrideReason('');
  }, [open, suggestedMeritPct]);

  useEffect(() => {
    if (!open || requestedPct === null) return;
    const t = setTimeout(() => {
      evaluate.mutate({
        employee_id: employeeId,
        requested_pct: requestedPct,
        suggested_pct: suggestedMeritPct,
        compa_ratio: compaRatio,
        months_since_last_raise: monthsSinceLastRaise,
        budget_available_pct: budgetAvailablePct,
        annual_impact: annualImpact,
        budget_remaining_annual: budgetRemainingAnnual,
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestedPct, annualImpact]);

  const evaluation = evaluate.data;
  const requiresOverride = evaluation?.requires_override ?? false;
  const isBlocked = evaluation?.is_blocked ?? false;

  const canSubmit =
    !isBlocked &&
    justification.trim().length >= 20 &&
    (!requiresOverride || overrideReason.trim().length >= 10) &&
    !create.isPending;

  const handleSubmit = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('root_company_id')
      .eq('id', userData.user!.id)
      .single();

    create.mutate(
      {
        root_company_id: profile!.root_company_id!,
        employee_id: employeeId,
        unit_id: unitId ?? null,
        fiscal_year: new Date().getFullYear(),
        box_position: boxPosition ?? null,
        performance_score: performanceScore ?? null,
        current_salary: currentSalary,
        compa_ratio: compaRatio ?? null,
        range_position_pct: rangePositionPct ?? null,
        months_since_last_raise: monthsSinceLastRaise ?? null,
        suggested_merit_pct: suggestedMeritPct,
        requested_merit_pct: requestedPct,
        new_salary: newSalary,
        monthly_impact: monthlyImpact,
        annual_impact: annualImpact,
        budget_available_pct: budgetAvailablePct ?? null,
        budget_remaining_annual: budgetRemainingAnnual ?? null,
        budget_after_request:
          budgetRemainingAnnual !== null && budgetRemainingAnnual !== undefined
            ? +(budgetRemainingAnnual - annualImpact).toFixed(2)
            : null,
        justification: justification.trim(),
        override_reason: requiresOverride ? overrideReason.trim() : null,
        gate_warnings: evaluation?.warnings ?? [],
        is_blocked: isBlocked,
        requested_by: userData.user!.id,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Governança de Mérito</DialogTitle>
              <DialogDescription>
                Solicitação de aumento — {employeeName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Métricas de contexto */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded border bg-muted/30">
              <div className="text-muted-foreground">Performance</div>
              <div className="font-semibold">{performanceScore?.toFixed(1) ?? '—'}</div>
            </div>
            <div className="p-2 rounded border bg-muted/30">
              <div className="text-muted-foreground">Compa-ratio</div>
              <div className="font-semibold">
                {compaRatio ? `${(compaRatio * 100).toFixed(0)}%` : '—'}
              </div>
            </div>
            <div className="p-2 rounded border bg-muted/30">
              <div className="text-muted-foreground">Último aumento</div>
              <div className="font-semibold">
                {monthsSinceLastRaise !== null && monthsSinceLastRaise !== undefined
                  ? `${monthsSinceLastRaise} m`
                  : '—'}
              </div>
            </div>
            <div className="p-2 rounded border bg-muted/30">
              <div className="text-muted-foreground">Budget</div>
              <div className="font-semibold">
                {budgetAvailablePct !== null && budgetAvailablePct !== undefined
                  ? `${budgetAvailablePct.toFixed(0)}%`
                  : '—'}
              </div>
            </div>
          </div>

          {/* Mérito */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="requested-pct">% Solicitado</Label>
              <Input
                id="requested-pct"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={requestedPct}
                onChange={(e) => setRequestedPct(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sugestão da matriz: <strong>{suggestedMeritPct.toFixed(1)}%</strong>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-xs text-muted-foreground">Impacto</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm">{formatCurrency(currentSalary)}</span>
                <ArrowRight className="h-3 w-3 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(newSalary)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="text-xs">
                Mensal: <strong>+{formatCurrency(monthlyImpact)}</strong>
              </div>
              <div className="text-xs">
                Anual: <strong>+{formatCurrency(annualImpact)}</strong>
              </div>
            </div>
          </div>

          {/* Gates */}
          {evaluation?.warnings && evaluation.warnings.length > 0 && (
            <div className="space-y-2">
              {evaluation.warnings.map((w, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 p-2 rounded border text-xs ${severityColor[w.severity]}`}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {w.code}
                      </Badge>
                      <span className="font-semibold uppercase">{w.severity}</span>
                    </div>
                    <p className="mt-1">{w.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isBlocked && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Solicitação bloqueada</AlertTitle>
              <AlertDescription>
                Resolva os bloqueios críticos acima antes de submeter.
              </AlertDescription>
            </Alert>
          )}

          {/* Justification */}
          <div>
            <Label htmlFor="justification">
              Justificativa <span className="text-destructive">*</span>{' '}
              <span className="text-xs text-muted-foreground">(mínimo 20 caracteres)</span>
            </Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Descreva o contexto, entregas e impacto que justificam o mérito..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {justification.length}/20
            </p>
          </div>

          {/* Override */}
          {requiresOverride && (
            <div>
              <Label htmlFor="override">
                Motivo do override <span className="text-destructive">*</span>{' '}
                <span className="text-xs text-muted-foreground">(mínimo 10 caracteres)</span>
              </Label>
              <Textarea
                id="override"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Por que este caso merece exceção à regra (compa-ratio alto ou divergência da matriz)?"
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Enviar para aprovação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
