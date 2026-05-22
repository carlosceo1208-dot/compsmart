import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ClipboardList, Sparkles, BarChart3, Plus, ArrowRight, Users, AlertTriangle, Copy, Mail, Send, Link2, LineChart, FileText, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DIMENSAO_LABEL, interpretarClima, CORRELACAO_COPSOQ, type ClimaDimensao } from '@/lib/climaQuestoes';

type Pesquisa = {
  id: string;
  nome: string;
  status: 'rascunho' | 'aberta' | 'fechada' | 'arquivada';
  modalidade: 'isolada' | 'integrada_psicossocial' | 'com_clientes_externos';
  periodo_inicio: string;
  periodo_fim: string | null;
  total_respondentes: number;
  score_geral: number | null;
  scores_dimensao: Record<string, number> | null;
  public_token: string;
  convites_enviados: number;
  last_invite_at: string | null;
};

const STATUS_BADGE: Record<Pesquisa['status'], { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  aberta: { label: 'Aberta', className: 'bg-[hsl(var(--nr1-primary)/0.15)] text-[hsl(var(--nr1-primary))]' },
  fechada: { label: 'Fechada', className: 'bg-emerald-100 text-emerald-700' },
  arquivada: { label: 'Arquivada', className: 'bg-muted text-muted-foreground' },
};

const MODALIDADE_LABEL: Record<Pesquisa['modalidade'], string> = {
  isolada: 'Clima isolado (60 questões, ~15min)',
  integrada_psicossocial: 'Integrada com Psicossocial (Clima + COPSOQ)',
  com_clientes_externos: 'Clima + Clientes externos',
};

export default function Nr1Clima() {
  const { activeCompanyId } = useCompanyContext();
  const { data: role } = useCurrentUserRole();
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [nome, setNome] = useState('Pesquisa de Clima 360° — ' + new Date().getFullYear());
  const [modalidade, setModalidade] = useState<Pesquisa['modalidade']>('isolada');

  const canManage = !!(role?.isAdmin || role?.isHR || role?.isSuperAdmin);

  const { data: pesquisas = [], isLoading } = useQuery({
    queryKey: ['clima-pesquisas', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('clima_pesquisas')
        .select('*')
        .eq('company_id', activeCompanyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pesquisa[];
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('clima_pesquisas')
        .insert({
          company_id: activeCompanyId,
          nome,
          modalidade,
          status: 'aberta',
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Pesquisa criada', description: 'Compartilhe o link com seus colaboradores.' });
      qc.invalidateQueries({ queryKey: ['clima-pesquisas'] });
      setOpenNew(false);
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const aberta = pesquisas.find((p) => p.status === 'aberta');

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="border-2 border-[hsl(11_77%_60%/0.45)] bg-gradient-to-br from-[hsl(11_77%_60%/0.08)] via-background to-[hsl(var(--nr1-primary)/0.05)]">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-[hsl(11_77%_60%/0.18)] flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-[hsl(11_77%_60%)]" />
            </div>
            <div>
              <CardTitle className="text-xl">Pesquisa de Clima Organizacional 360°</CardTitle>
              <CardDescription className="mt-1">
                60 questões · 10 dimensões · escala Likert 5 pontos · respostas anônimas (LGPD).
                Cruzável com riscos psicossociais (COPSOQ-III) para identificar causas raiz.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManage && pesquisas.some((p) => p.total_respondentes > 0) && (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/nr1/clima/dashboard"><LineChart className="h-4 w-4 mr-1" /> Dashboard analítico</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/nr1/clima/relatorios"><FileText className="h-4 w-4 mr-1" /> Relatórios</Link>
                </Button>
              </>
            )}
            {canManage && (
              <Button asChild variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                <Link to="/nr1/clima/governanca"><ShieldCheck className="h-4 w-4 mr-1" /> Governança</Link>
              </Button>
            )}
            {canManage && pesquisas.some((p) => p.modalidade === 'com_clientes_externos') && (
              <Button asChild variant="outline" size="sm">
                <Link to="/nr1/clima/externo"><Users className="h-4 w-4 mr-1" /> Clima externo</Link>
              </Button>
            )}
            {canManage && (
              <Dialog open={openNew} onOpenChange={setOpenNew}>
                <DialogTrigger asChild>
                  <Button className="bg-[hsl(11_77%_60%)] hover:bg-[hsl(11_77%_55%)] text-white">
                    <Plus className="h-4 w-4 mr-1" /> Nova pesquisa
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova pesquisa de clima</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Nome do ciclo</Label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} />
                  </div>
                  <div>
                    <Label>Modalidade</Label>
                    <Select value={modalidade} onValueChange={(v) => setModalidade(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(MODALIDADE_LABEL).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
                  <Button onClick={() => criar.mutate()} disabled={criar.isPending}>
                    {criar.isPending ? 'Criando…' : 'Criar e abrir'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* CTA respondente */}
      {aberta && (
        <Card className="border-[hsl(var(--nr1-primary)/0.3)] bg-[hsl(var(--nr1-primary)/0.04)]">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-semibold">Há uma pesquisa aberta: <span className="text-[hsl(var(--nr1-primary))]">{aberta.nome}</span></p>
              <p className="text-sm text-muted-foreground">Sua resposta é anônima — leva cerca de 15 minutos.</p>
            </div>
            <Button asChild>
              <Link to={`/nr1/clima/${aberta.id}/responder`}>Responder agora <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de pesquisas */}
      <div className="grid gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!isLoading && pesquisas.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma pesquisa de clima ainda.</p>
              {canManage && <p className="text-xs mt-1">Crie a primeira para começar a medir.</p>}
            </CardContent>
          </Card>
        )}
        {pesquisas.map((p) => {
          const interp = interpretarClima(p.score_geral);
          return (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{p.nome}</CardTitle>
                    <CardDescription>
                      {MODALIDADE_LABEL[p.modalidade]} · iniciada {new Date(p.periodo_inicio).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <Badge className={STATUS_BADGE[p.status].className}>{STATUS_BADGE[p.status].label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Respondentes</p>
                    <p className="font-bold text-lg">{p.total_respondentes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Score geral</p>
                    <p className="font-bold text-lg">{p.score_geral?.toFixed(1) ?? '—'}<span className="text-xs text-muted-foreground"> /5</span></p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Interpretação</p>
                    <p className="font-semibold">{interp.label}</p>
                  </div>
                </div>
                {p.scores_dimensao && (
                  <div className="mt-4 space-y-1">
                    {(Object.entries(p.scores_dimensao) as [ClimaDimensao, number][])
                      .sort((a, b) => b[1] - a[1])
                      .map(([dim, score]) => {
                        const inter = interpretarClima(score);
                        return (
                          <div key={dim} className="flex items-center gap-2 text-xs">
                            <div className="w-44 truncate" title={DIMENSAO_LABEL[dim]}>{DIMENSAO_LABEL[dim]}</div>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{
                                  width: `${(score / 5) * 100}%`,
                                  background:
                                    inter.color === 'critico' || inter.color === 'insatisfatorio'
                                      ? 'hsl(0 70% 55%)'
                                      : inter.color === 'moderado'
                                      ? 'hsl(38 90% 55%)'
                                      : 'hsl(160 70% 45%)',
                                }}
                              />
                            </div>
                            <div className="w-10 text-right font-mono">{score.toFixed(1)}</div>
                          </div>
                        );
                      })}
                  </div>
                )}
                {p.status === 'aberta' && canManage && (
                  <DistribuicaoBlock pesquisa={p} />
                )}
                <div className="flex justify-end gap-2 mt-4">
                  {p.status === 'aberta' && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/nr1/clima/${p.id}/responder`}>Responder (preview)</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(var(--nr1-primary))]" />
            Correlação Clima × Riscos Psicossociais (COPSOQ-III)
          </CardTitle>
          <CardDescription>
            Quando combinada com diagnósticos psicossociais, a pesquisa permite identificar causas raiz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {(Object.entries(CORRELACAO_COPSOQ) as [ClimaDimensao, string][]).map(([dim, fator]) => (
              <div key={dim} className="flex items-center justify-between border-b py-1.5">
                <span className="font-medium">{DIMENSAO_LABEL[dim]}</span>
                <span className="text-muted-foreground">↔ {fator}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Veja causas raiz confirmadas e plano de ação unificado quando há ambos os instrumentos aplicados.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to="/nr1/clima/correlacao"><Sparkles className="h-3.5 w-3.5 mr-1" /> Ver correlação</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DistribuicaoBlock({ pesquisa }: { pesquisa: Pesquisa }) {
  const [sending, setSending] = useState<'invite' | 'reminder' | null>(null);
  const qc = useQueryClient();

  const publicLink = `${window.location.origin}/clima/publico/${pesquisa.public_token}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      toast({ title: 'Link copiado', description: 'Compartilhe com seus colaboradores.' });
    } catch {
      toast({ title: 'Erro', description: 'Copie manualmente: ' + publicLink, variant: 'destructive' });
    }
  };

  const enviar = async (isReminder: boolean) => {
    setSending(isReminder ? 'reminder' : 'invite');
    try {
      const { data, error } = await supabase.functions.invoke('send-clima-invitations', {
        body: { pesquisa_id: pesquisa.id, is_reminder: isReminder },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: isReminder ? 'Lembretes enviados' : 'Convites enviados',
        description: `${data.sent_count} colaborador(es) notificado(s)${data.error_count ? ` · ${data.error_count} erro(s)` : ''}.`,
      });
      qc.invalidateQueries({ queryKey: ['clima-pesquisas'] });
    } catch (e: any) {
      toast({ title: 'Erro ao enviar', description: e.message, variant: 'destructive' });
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="mt-4 border-t pt-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        <Send className="h-3 w-3" /> Distribuição
      </p>

      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
        <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <code className="text-xs flex-1 truncate" title={publicLink}>{publicLink}</code>
        <Button size="sm" variant="ghost" onClick={copiar} className="h-7 px-2">
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => enviar(false)}
          disabled={sending !== null}
          className="bg-[hsl(11_77%_60%)] hover:bg-[hsl(11_77%_55%)] text-white"
        >
          <Mail className="h-3.5 w-3.5 mr-1.5" />
          {sending === 'invite' ? 'Enviando…' : 'Enviar convites por e-mail'}
        </Button>
        {pesquisa.convites_enviados > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => enviar(true)}
            disabled={sending !== null}
          >
            {sending === 'reminder' ? 'Enviando…' : 'Enviar lembrete'}
          </Button>
        )}
        <div className="text-xs text-muted-foreground ml-auto">
          {pesquisa.convites_enviados > 0 ? (
            <>
              <strong>{pesquisa.convites_enviados}</strong> convite(s) enviado(s)
              {pesquisa.last_invite_at && (
                <> · último em {new Date(pesquisa.last_invite_at).toLocaleDateString('pt-BR')}</>
              )}
            </>
          ) : (
            'Nenhum convite enviado ainda'
          )}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Envia para todos os colaboradores ativos com e-mail cadastrado. Respostas continuam <strong>100% anônimas</strong>.
      </p>
    </div>
  );
}
