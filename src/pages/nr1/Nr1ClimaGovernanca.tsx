import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, CheckCircle2, XCircle, Clock, RotateCcw, Send, FileText, History, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AprovacaoStatus = 'rascunho' | 'em_aprovacao' | 'aprovado' | 'rejeitado' | 'revisao_solicitada';

type Plano = {
  id: string;
  titulo: string;
  descricao: string | null;
  dimensao: string | null;
  responsavel: string | null;
  prazo: string | null;
  prioridade: 'baixa' | 'media' | 'alta';
  status: string;
  progresso: number;
  origem: string | null;
  aprovacao_status: AprovacaoStatus;
  submetido_em: string | null;
  revisado_em: string | null;
  observacao_aprovacao: string | null;
  impacto_estimado: string | null;
  custo_estimado: number | null;
  clima_pesquisa_id: string | null;
  created_at: string;
};

type Historico = {
  id: string;
  acao: string;
  status_anterior: AprovacaoStatus | null;
  status_novo: AprovacaoStatus;
  observacao: string | null;
  ator_nome: string | null;
  created_at: string;
};

const STATUS_META: Record<AprovacaoStatus, { label: string; className: string; icon: any }> = {
  rascunho: { label: 'Rascunho', className: 'bg-muted text-muted-foreground', icon: FileText },
  em_aprovacao: { label: 'Em aprovação', className: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  aprovado: { label: 'Aprovado', className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  rejeitado: { label: 'Rejeitado', className: 'bg-amber-100 text-amber-800 border-amber-200', icon: XCircle },
  revisao_solicitada: { label: 'Revisão solicitada', className: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: RotateCcw },
};

const PRIO_COLOR: Record<string, string> = {
  alta: 'bg-amber-100 text-amber-700',
  media: 'bg-amber-100 text-amber-700',
  baixa: 'bg-sky-100 text-sky-700',
};

export default function Nr1ClimaGovernanca() {
  const { activeCompanyId } = useCompanyContext();
  const { data: role } = useCurrentUserRole();
  const qc = useQueryClient();
  const [tab, setTab] = useState<AprovacaoStatus | 'todos'>('em_aprovacao');
  const [selected, setSelected] = useState<Plano | null>(null);
  const [actionOpen, setActionOpen] = useState<null | AprovacaoStatus>(null);
  const [observacao, setObservacao] = useState('');

  const isApprover = !!(role?.isAdmin || role?.isSuperAdmin);
  const canSubmit = !!(role?.isAdmin || role?.isHR || role?.isSuperAdmin);

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ['nr1-planos-gov', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('nr1_planos_acao')
        .select('*')
        .eq('company_id', activeCompanyId)
        .order('submetido_em', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Plano[];
    },
  });

  const { data: historico = [] } = useQuery({
    queryKey: ['nr1-plano-historico', selected?.id],
    enabled: !!selected?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('nr1_planos_aprovacao_historico')
        .select('*')
        .eq('plano_id', selected!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Historico[];
    },
  });

  const transitar = useMutation({
    mutationFn: async ({ plano_id, novo_status, obs }: { plano_id: string; novo_status: AprovacaoStatus; obs?: string }) => {
      const { data, error } = await (supabase as any).rpc('nr1_plano_transicao', {
        _plano_id: plano_id,
        _novo_status: novo_status,
        _observacao: obs || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Status atualizado', description: 'O fluxo de aprovação foi registrado.' });
      qc.invalidateQueries({ queryKey: ['nr1-planos-gov'] });
      qc.invalidateQueries({ queryKey: ['nr1-plano-historico'] });
      setActionOpen(null);
      setObservacao('');
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const filtrados = useMemo(() => {
    if (tab === 'todos') return planos;
    return planos.filter((p) => p.aprovacao_status === tab);
  }, [planos, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: planos.length };
    (Object.keys(STATUS_META) as AprovacaoStatus[]).forEach((k) => {
      c[k] = planos.filter((p) => p.aprovacao_status === k).length;
    });
    return c;
  }, [planos]);

  const confirmTransition = () => {
    if (!selected || !actionOpen) return;
    transitar.mutate({ plano_id: selected.id, novo_status: actionOpen, obs: observacao });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/clima" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" /> Voltar para Clima
          </Link>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-[hsl(var(--nr1-primary))]" />
            Governança & Aprovações
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Fluxo formal de aprovação para planos de ação derivados de pesquisas de clima e diagnósticos psicossociais.
            Rastreabilidade completa para conformidade NR-1.
          </p>
        </div>
        {isApprover && (
          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
            <ShieldCheck className="h-3 w-3 mr-1" /> Você é aprovador
          </Badge>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['em_aprovacao','aprovado','revisao_solicitada','rejeitado','rascunho'] as AprovacaoStatus[]).map((s) => {
          const meta = STATUS_META[s];
          const Icon = meta.icon;
          return (
            <Card key={s} className="cursor-pointer hover:shadow-md transition" onClick={() => setTab(s)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{counts[s] ?? 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{meta.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="todos">Todos ({counts.todos})</TabsTrigger>
          <TabsTrigger value="em_aprovacao">Em aprovação ({counts.em_aprovacao})</TabsTrigger>
          <TabsTrigger value="aprovado">Aprovados ({counts.aprovado})</TabsTrigger>
          <TabsTrigger value="revisao_solicitada">Revisão ({counts.revisao_solicitada})</TabsTrigger>
          <TabsTrigger value="rejeitado">Rejeitados ({counts.rejeitado})</TabsTrigger>
          <TabsTrigger value="rascunho">Rascunhos ({counts.rascunho})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : filtrados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum plano nesta categoria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtrados.map((p) => {
                const meta = STATUS_META[p.aprovacao_status];
                const Icon = meta.icon;
                return (
                  <Card key={p.id} className="hover:shadow-md transition cursor-pointer" onClick={() => setSelected(p)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge className={`${meta.className} border`}>
                              <Icon className="h-3 w-3 mr-1" />
                              {meta.label}
                            </Badge>
                            <Badge variant="outline" className={PRIO_COLOR[p.prioridade]}>
                              {p.prioridade}
                            </Badge>
                            {p.origem && (
                              <Badge variant="outline" className="text-xs">
                                {p.origem === 'clima' ? '🌡️ Clima' : p.origem === 'copsoq' ? '🧠 COPSOQ' : '✍️ Manual'}
                              </Badge>
                            )}
                            {p.dimensao && <span className="text-xs text-muted-foreground">{p.dimensao}</span>}
                          </div>
                          <h3 className="font-semibold text-base">{p.titulo}</h3>
                          {p.descricao && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.descricao}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            {p.responsavel && <span>👤 {p.responsavel}</span>}
                            {p.prazo && <span>📅 {format(new Date(p.prazo), 'dd/MM/yyyy', { locale: ptBR })}</span>}
                            {p.submetido_em && <span>Submetido em {format(new Date(p.submetido_em), 'dd/MM/yyyy')}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const meta = STATUS_META[selected.aprovacao_status];
                    const Icon = meta.icon;
                    return (
                      <Badge className={`${meta.className} border`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {meta.label}
                      </Badge>
                    );
                  })()}
                  <Badge variant="outline" className={PRIO_COLOR[selected.prioridade]}>{selected.prioridade}</Badge>
                </div>
                <SheetTitle>{selected.titulo}</SheetTitle>
                <SheetDescription>{selected.dimensao}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 mt-6">
                {selected.descricao && (
                  <div>
                    <p className="text-sm font-medium mb-1">Descrição</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.descricao}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selected.responsavel && (
                    <div>
                      <p className="font-medium text-xs text-muted-foreground">Responsável</p>
                      <p>{selected.responsavel}</p>
                    </div>
                  )}
                  {selected.prazo && (
                    <div>
                      <p className="font-medium text-xs text-muted-foreground">Prazo</p>
                      <p>{format(new Date(selected.prazo), 'dd/MM/yyyy')}</p>
                    </div>
                  )}
                  {selected.impacto_estimado && (
                    <div>
                      <p className="font-medium text-xs text-muted-foreground">Impacto estimado</p>
                      <p>{selected.impacto_estimado}</p>
                    </div>
                  )}
                  {selected.custo_estimado != null && (
                    <div>
                      <p className="font-medium text-xs text-muted-foreground">Custo estimado</p>
                      <p>R$ {Number(selected.custo_estimado).toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                </div>

                {selected.observacao_aprovacao && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Última observação de aprovação</p>
                      <p className="text-sm whitespace-pre-wrap">{selected.observacao_aprovacao}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.aprovacao_status === 'rascunho' && canSubmit && (
                    <Button onClick={() => setActionOpen('em_aprovacao')} className="gap-2">
                      <Send className="h-4 w-4" /> Submeter para aprovação
                    </Button>
                  )}
                  {selected.aprovacao_status === 'em_aprovacao' && isApprover && (
                    <>
                      <Button onClick={() => setActionOpen('aprovado')} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> Aprovar
                      </Button>
                      <Button onClick={() => setActionOpen('revisao_solicitada')} variant="outline" className="gap-2">
                        <RotateCcw className="h-4 w-4" /> Solicitar revisão
                      </Button>
                      <Button onClick={() => setActionOpen('rejeitado')} variant="destructive" className="gap-2">
                        <XCircle className="h-4 w-4" /> Rejeitar
                      </Button>
                    </>
                  )}
                  {selected.aprovacao_status === 'revisao_solicitada' && canSubmit && (
                    <Button onClick={() => setActionOpen('em_aprovacao')} className="gap-2">
                      <Send className="h-4 w-4" /> Re-submeter
                    </Button>
                  )}
                  {selected.aprovacao_status === 'rejeitado' && canSubmit && (
                    <Button onClick={() => setActionOpen('rascunho')} variant="outline" className="gap-2">
                      <RotateCcw className="h-4 w-4" /> Reabrir como rascunho
                    </Button>
                  )}
                </div>

                {/* History */}
                <div className="pt-4 border-t">
                  <p className="font-medium flex items-center gap-2 mb-3">
                    <History className="h-4 w-4" /> Histórico de aprovação
                  </p>
                  <ScrollArea className="max-h-64">
                    <div className="space-y-2">
                      {historico.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem eventos registrados ainda.</p>
                      ) : (
                        historico.map((h) => (
                          <div key={h.id} className="border-l-2 border-[hsl(var(--nr1-primary))] pl-3 py-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{STATUS_META[h.status_novo]?.label || h.status_novo}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(h.created_at), "dd/MM/yyyy 'às' HH:mm")}
                              </span>
                            </div>
                            <p className="text-xs mt-1">
                              <span className="font-medium">{h.ator_nome || 'Usuário'}</span>
                              {h.status_anterior && <span className="text-muted-foreground"> · de {STATUS_META[h.status_anterior]?.label}</span>}
                            </p>
                            {h.observacao && <p className="text-sm text-muted-foreground mt-1 italic">"{h.observacao}"</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Action confirmation */}
      <Dialog open={!!actionOpen} onOpenChange={(o) => !o && setActionOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionOpen && STATUS_META[actionOpen]?.label}
            </DialogTitle>
            <DialogDescription>
              {actionOpen === 'aprovado' && 'O plano será marcado como aprovado e poderá entrar em execução.'}
              {actionOpen === 'rejeitado' && 'O plano será marcado como rejeitado. Justifique abaixo.'}
              {actionOpen === 'revisao_solicitada' && 'Indique o que precisa ser ajustado para nova submissão.'}
              {actionOpen === 'em_aprovacao' && 'O plano será enviado para aprovação dos administradores.'}
              {actionOpen === 'rascunho' && 'O plano voltará para rascunho para edição.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Observação (opcional, mas recomendada)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(null)}>Cancelar</Button>
            <Button onClick={confirmTransition} disabled={transitar.isPending}>
              {transitar.isPending ? 'Aplicando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
