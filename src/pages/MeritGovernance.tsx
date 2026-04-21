import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShieldCheck, CheckCircle2, XCircle, Clock, History, AlertTriangle } from 'lucide-react';
import {
  useMeritApprovalRequests,
  useMeritApprovalHistory,
  useReviewMeritRequest,
  useCancelMeritRequest,
  type MeritApprovalRequest,
  type GateWarning,
} from '@/hooks/useMeritGovernance';
import { formatCurrency } from '@/lib/formatters';

const statusBadge: Record<MeritApprovalRequest['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  approved: { label: 'Aprovada', variant: 'default' },
  rejected: { label: 'Rejeitada', variant: 'destructive' },
  cancelled: { label: 'Cancelada', variant: 'outline' },
  applied: { label: 'Aplicada', variant: 'default' },
};

export default function MeritGovernance() {
  const [tab, setTab] = useState<MeritApprovalRequest['status'] | 'all'>('pending');
  const { data: requests, isLoading } = useMeritApprovalRequests(
    tab === 'all' ? undefined : tab
  );

  const [selected, setSelected] = useState<MeritApprovalRequest | null>(null);
  const [historyFor, setHistoryFor] = useState<MeritApprovalRequest | null>(null);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Governança de Mérito</h1>
          <p className="text-sm text-muted-foreground">
            Aprovação de aumentos com gates de compa-ratio, budget e histórico
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-1" /> Pendentes
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovadas
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="h-4 w-4 mr-1" /> Rejeitadas
          </TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !requests || requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma solicitação encontrada nesta categoria.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  onReview={() => setSelected(r)}
                  onHistory={() => setHistoryFor(r)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ReviewDialog
        request={selected}
        onClose={() => setSelected(null)}
      />
      <HistoryDialog
        request={historyFor}
        onClose={() => setHistoryFor(null)}
      />
    </div>
  );
}

function RequestCard({
  request,
  onReview,
  onHistory,
}: {
  request: MeritApprovalRequest;
  onReview: () => void;
  onHistory: () => void;
}) {
  const cancel = useCancelMeritRequest();
  const status = statusBadge[request.status];
  const warnings = request.gate_warnings ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                {request.requested_merit_pct.toFixed(1)}% de mérito solicitado
              </CardTitle>
              <Badge variant={status.variant}>{status.label}</Badge>
              {request.is_blocked && (
                <Badge variant="destructive" className="text-[10px]">
                  BLOQUEADA
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Funcionário {request.employee_id.slice(0, 8)}… · Sugerido{' '}
              {request.suggested_merit_pct.toFixed(1)}% · Solicitado em{' '}
              {new Date(request.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={onHistory}>
              <History className="h-4 w-4" />
            </Button>
            {request.status === 'pending' && (
              <>
                <Button size="sm" variant="outline" onClick={() => cancel.mutate(request.id)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={onReview}>
                  Revisar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <Metric label="Salário atual" value={formatCurrency(request.current_salary)} />
          <Metric label="Novo salário" value={formatCurrency(request.new_salary)} />
          <Metric label="Impacto mensal" value={`+${formatCurrency(request.monthly_impact)}`} />
          <Metric label="Impacto anual" value={`+${formatCurrency(request.annual_impact)}`} />
        </div>
        {warnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {warnings.map((w: GateWarning, i: number) => (
              <div
                key={i}
                className="flex items-start gap-1 text-xs text-muted-foreground"
              >
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>
                  <strong>{w.code}:</strong> {w.message}
                </span>
              </div>
            ))}
          </div>
        )}
        {request.justification && (
          <div className="mt-3 p-2 rounded bg-muted/30 text-xs">
            <span className="text-muted-foreground">Justificativa: </span>
            {request.justification}
          </div>
        )}
        {request.approval_notes && (
          <div className="mt-2 p-2 rounded bg-muted/30 text-xs">
            <span className="text-muted-foreground">Decisão: </span>
            {request.approval_notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded border bg-muted/30">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function ReviewDialog({
  request,
  onClose,
}: {
  request: MeritApprovalRequest | null;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState('');
  const review = useReviewMeritRequest();

  if (!request) return null;

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revisar solicitação</DialogTitle>
          <DialogDescription>
            {request.requested_merit_pct.toFixed(1)}% — Impacto anual{' '}
            {formatCurrency(request.annual_impact)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações da revisão (obrigatório para rejeitar)"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="destructive"
            disabled={notes.trim().length < 5 || review.isPending}
            onClick={() =>
              review.mutate(
                { id: request.id, decision: 'rejected', notes },
                { onSuccess: onClose }
              )
            }
          >
            <XCircle className="h-4 w-4 mr-1" /> Rejeitar
          </Button>
          <Button
            disabled={request.is_blocked || review.isPending}
            onClick={() =>
              review.mutate(
                { id: request.id, decision: 'approved', notes },
                { onSuccess: onClose }
              )
            }
          >
            <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({
  request,
  onClose,
}: {
  request: MeritApprovalRequest | null;
  onClose: () => void;
}) {
  const { data: history, isLoading } = useMeritApprovalHistory(request?.id ?? null);
  if (!request) return null;
  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico da solicitação</DialogTitle>
          <DialogDescription>Trilha de auditoria imutável</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(history ?? []).map((h) => (
              <div key={h.id} className="border-l-2 border-primary/40 pl-3 py-1">
                <div className="text-xs font-semibold uppercase">{h.action}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(h.created_at).toLocaleString('pt-BR')}
                  {h.previous_status && ` · ${h.previous_status} → ${h.new_status}`}
                </div>
                {h.notes && <div className="text-xs mt-1">{h.notes}</div>}
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
