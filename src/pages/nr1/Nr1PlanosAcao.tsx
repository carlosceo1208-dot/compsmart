import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, ListChecks, AlertTriangle } from 'lucide-react';
import {
  useNr1PlanosAcao, useUpsertPlanoAcao, useDeletePlanoAcao,
  type Nr1PlanoAcao, type Nr1AcaoStatus, type Nr1AcaoPrioridade,
} from '@/hooks/useNr1PlanosAcao';
import {
  ACAO_STATUS_LABEL, ACAO_PRIORIDADE_LABEL,
  ACAO_STATUS_CLASS, ACAO_PRIORIDADE_CLASS,
} from '@/lib/nr1Risco';
import { DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';
import { AssistenteIaPlanoAcaoDialog } from '@/components/nr1/AssistenteIaPlanoAcaoDialog';

const STATUS_OPTS: Nr1AcaoStatus[] = ['pendente', 'em_andamento', 'concluido', 'atrasado'];
const PRIORIDADE_OPTS: Nr1AcaoPrioridade[] = ['baixa', 'media', 'alta', 'critica'];

export default function Nr1PlanosAcao() {
  const { data: planos = [], isLoading } = useNr1PlanosAcao();
  const upsert = useUpsertPlanoAcao();
  const del = useDeletePlanoAcao();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Nr1PlanoAcao> | null>(null);

  const startNew = () => {
    setEditing({ titulo: '', status: 'pendente', prioridade: 'media', progresso: 0 });
    setOpen(true);
  };

  const startEdit = (p: Nr1PlanoAcao) => {
    setEditing(p);
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.titulo?.trim()) return;
    await upsert.mutateAsync(editing as any);
    setOpen(false);
    setEditing(null);
  };

  const totais = {
    total: planos.length,
    concluidos: planos.filter((p) => p.status === 'concluido').length,
    atrasados: planos.filter((p) => p.status === 'atrasado').length,
    emAndamento: planos.filter((p) => p.status === 'em_andamento').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ListChecks className="h-5 w-5 nr1-text-primary" /> Plano de Ação NR-1
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe ações corretivas e preventivas com responsáveis, prazos e evidências.
          </p>
        </div>
        <div className="flex gap-2">
          <AssistenteIaPlanoAcaoDialog />
          <Button onClick={startNew} className="nr1-bg-primary">
            <Plus className="h-4 w-4 mr-1" /> Nova ação
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Total de ações" value={totais.total} />
        <SummaryCard label="Em andamento" value={totais.emAndamento} tone="info" />
        <SummaryCard label="Concluídas" value={totais.concluidos} tone="success" />
        <SummaryCard label="Atrasadas" value={totais.atrasados} tone="danger" />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : planos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto nr1-text-primary" />
            <h3 className="font-semibold">Nenhuma ação cadastrada</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Cadastre as ações decorrentes do diagnóstico psicossocial para garantir conformidade NR-1.
            </p>
            <Button onClick={startNew} className="nr1-bg-primary">
              <Plus className="h-4 w-4 mr-1" /> Criar primeira ação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {planos.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{p.titulo}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={ACAO_STATUS_CLASS[p.status]}>{ACAO_STATUS_LABEL[p.status]}</Badge>
                      <Badge className={ACAO_PRIORIDADE_CLASS[p.prioridade]}>
                        Prioridade {ACAO_PRIORIDADE_LABEL[p.prioridade]}
                      </Badge>
                      {p.origem && p.origem !== 'manual' && (
                        <Badge variant="outline" className={
                          p.origem === 'unificado' ? 'border-amber-300 text-amber-700 bg-amber-50'
                          : p.origem === 'clima' ? 'border-amber-300 text-amber-700 bg-amber-50'
                          : 'border-sky-300 text-sky-700 bg-sky-50'
                        }>
                          {p.origem === 'unificado' ? '⚡ Unificado' : p.origem === 'clima' ? '🌡️ Clima' : '🧠 NR-1'}
                        </Badge>
                      )}
                      {p.aprovacao_status && p.aprovacao_status !== 'rascunho' && (
                        <Badge variant="outline" className="text-xs">Aprovação: {p.aprovacao_status.replace('_', ' ')}</Badge>
                      )}
                      {p.dimensao && (
                        <Badge variant="outline">{DIMENSAO_LABEL[p.dimensao as Dimensao] ?? p.dimensao}</Badge>
                      )}
                      {p.dimensoes_relacionadas && p.dimensoes_relacionadas.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {p.dimensoes_relacionadas.length} dimensões relacionadas
                        </Badge>
                      )}
                      {p.prazo && <Badge variant="outline">Prazo: {new Date(p.prazo).toLocaleDateString('pt-BR')}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.descricao && <p className="text-sm text-muted-foreground">{p.descricao}</p>}
                {p.responsavel && <p className="text-xs"><span className="text-muted-foreground">Responsável: </span>{p.responsavel}</p>}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium tabular-nums">{p.progresso}%</span>
                  </div>
                  <Progress value={p.progresso} className="h-2" />
                </div>
                {p.evidencias && (
                  <p className="text-xs italic text-muted-foreground border-l-2 pl-2 border-[hsl(var(--nr1-primary))]">
                    {p.evidencias}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar ação' : 'Nova ação'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Título *</Label>
                <Input value={editing.titulo ?? ''} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={3} value={editing.descricao ?? ''} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as Nr1AcaoStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTS.map((s) => <SelectItem key={s} value={s}>{ACAO_STATUS_LABEL[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={editing.prioridade} onValueChange={(v) => setEditing({ ...editing, prioridade: v as Nr1AcaoPrioridade })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORIDADE_OPTS.map((s) => <SelectItem key={s} value={s}>{ACAO_PRIORIDADE_LABEL[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Dimensão NR-1</Label>
                  <Select value={editing.dimensao ?? ''} onValueChange={(v) => setEditing({ ...editing, dimensao: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DIMENSAO_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prazo</Label>
                  <Input type="date" value={editing.prazo ?? ''} onChange={(e) => setEditing({ ...editing, prazo: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Responsável</Label>
                  <Input value={editing.responsavel ?? ''} onChange={(e) => setEditing({ ...editing, responsavel: e.target.value })} />
                </div>
                <div>
                  <Label>Progresso (%)</Label>
                  <Input type="number" min={0} max={100} value={editing.progresso ?? 0}
                    onChange={(e) => setEditing({ ...editing, progresso: Math.min(100, Math.max(0, Number(e.target.value))) })} />
                </div>
              </div>
              <div>
                <Label>Evidências / Observações</Label>
                <Textarea rows={2} value={editing.evidencias ?? ''} onChange={(e) => setEditing({ ...editing, evidencias: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={upsert.isPending} className="nr1-bg-primary">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'danger' | 'info' }) {
  const toneClass =
    tone === 'success' ? 'text-emerald-600' :
    tone === 'danger' ? 'text-orange-600' :
    tone === 'info' ? 'text-blue-600' : 'nr1-text-primary';
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
