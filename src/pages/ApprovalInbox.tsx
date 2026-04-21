import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApprovalInbox, useEscalateOverdue } from '@/hooks/useApprovalInbox';
import { Inbox, AlertTriangle, Clock, ArrowUpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmt = (n: number | null) =>
  n === null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default function ApprovalInbox() {
  const { data: items, isLoading } = useApprovalInbox();
  const escalate = useEscalateOverdue();

  const pending = items?.filter((i) => !i.is_overdue) ?? [];
  const overdue = items?.filter((i) => i.is_overdue) ?? [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Inbox className="h-7 w-7" /> Minhas Aprovações</h1>
          <p className="text-muted-foreground">Solicitações de mérito e talent pendentes da sua revisão</p>
        </div>
        <Button variant="outline" onClick={() => escalate.mutate()} disabled={escalate.isPending}>
          <ArrowUpCircle className="h-4 w-4 mr-2" /> Escalar vencidas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Pendentes</CardDescription><CardTitle>{pending.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Vencidas</CardDescription><CardTitle className="text-destructive">{overdue.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total</CardDescription><CardTitle>{items?.length ?? 0}</CardTitle></CardHeader></Card>
      </div>

      {overdue.length > 0 && (
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Vencidas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdue.map((it) => (
              <ItemRow key={it.assignment_id} item={it} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Pendentes</CardTitle></CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && pending.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma aprovação pendente. 🎉</p>
          )}
          <div className="space-y-2">
            {pending.map((it) => <ItemRow key={it.assignment_id} item={it} />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ItemRow({ item }: { item: any }) {
  return (
    <div className="flex items-center justify-between border rounded p-3">
      <div className="flex-1">
        <div className="font-medium">{item.employee_name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Badge variant="outline">{item.approval_type === 'merit' ? 'Mérito' : 'Talent'}</Badge>
          <span>{Number(item.requested_pct ?? 0).toFixed(2)}%</span>
          <span>· {fmt(Number(item.annual_impact ?? 0))}/ano</span>
          {item.escalated && <Badge variant="destructive" className="text-xs">Escalado</Badge>}
        </div>
      </div>
      <div className="text-right mr-3">
        <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
          <Clock className="h-3 w-3" />
          {item.is_overdue ? 'Vencida' : `${Math.round(item.hours_remaining)}h restantes`}
        </div>
      </div>
      <Button asChild size="sm" variant={item.is_overdue ? 'destructive' : 'default'}>
        <Link to={item.approval_type === 'merit' ? '/merit-governance' : '/talent-intelligence'}>
          Revisar
        </Link>
      </Button>
    </div>
  );
}
