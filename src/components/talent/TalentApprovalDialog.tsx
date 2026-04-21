import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Send, RotateCcw, History, FileEdit } from 'lucide-react';
import {
  useTalentRecommendationHistory,
  useUpdateTalentRecommendationStatus,
} from '@/hooks/useTalentApproval';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendationId: string;
  currentStatus: string;
  employeeName: string;
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Rascunho', cls: 'bg-muted text-muted-foreground' },
  submitted: { label: 'Enviado', cls: 'bg-primary/10 text-primary border-primary/30' },
  pending: { label: 'Pendente', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
  approved: { label: 'Aprovado', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  rejected: { label: 'Rejeitado', cls: 'bg-destructive/10 text-destructive border-destructive/30' },
  applied: { label: 'Aplicado', cls: 'bg-emerald-600/20 text-emerald-700 border-emerald-600/40' },
};

export function TalentApprovalDialog({
  open,
  onOpenChange,
  recommendationId,
  currentStatus,
  employeeName,
}: Props) {
  const [notes, setNotes] = useState('');
  const update = useUpdateTalentRecommendationStatus();
  const { data: history, isLoading } = useTalentRecommendationHistory(open ? recommendationId : null);

  const handle = (newStatus: 'draft' | 'submitted' | 'approved' | 'rejected' | 'applied') => {
    update.mutate(
      { recommendation_id: recommendationId, new_status: newStatus, notes: notes.trim() || undefined },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const status = statusBadge[currentStatus] ?? { label: currentStatus, cls: '' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileEdit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Aprovação Talent Intelligence</DialogTitle>
              <DialogDescription>
                {employeeName} ·{' '}
                <Badge variant="outline" className={status.cls}>
                  {status.label}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre a decisão ou edição (opcional para rascunho/envio; recomendado em rejeição)"
              rows={3}
            />
          </div>

          {/* Histórico */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <History className="h-4 w-4" />
              Trilha de auditoria
            </div>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !history || history.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2">Sem eventos registrados.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div key={h.id} className="border-l-2 border-primary/40 pl-3 py-1">
                    <div className="text-xs font-semibold uppercase">{h.action}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(h.created_at).toLocaleString('pt-BR')}
                      {h.previous_status && ` · ${h.previous_status} → ${h.new_status}`}
                    </div>
                    {h.notes && <div className="text-xs mt-1">{h.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {currentStatus === 'draft' && (
            <Button onClick={() => handle('submitted')} disabled={update.isPending}>
              <Send className="h-4 w-4 mr-1" /> Enviar para aprovação
            </Button>
          )}
          {(currentStatus === 'submitted' || currentStatus === 'pending') && (
            <>
              <Button variant="outline" onClick={() => handle('draft')} disabled={update.isPending}>
                <RotateCcw className="h-4 w-4 mr-1" /> Voltar a rascunho
              </Button>
              <Button
                variant="destructive"
                onClick={() => handle('rejected')}
                disabled={update.isPending || notes.trim().length < 5}
              >
                <XCircle className="h-4 w-4 mr-1" /> Rejeitar
              </Button>
              <Button onClick={() => handle('approved')} disabled={update.isPending}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
              </Button>
            </>
          )}
          {currentStatus === 'approved' && (
            <Button onClick={() => handle('applied')} disabled={update.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar como aplicado
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
