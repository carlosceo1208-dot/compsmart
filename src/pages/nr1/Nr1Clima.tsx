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
import { ClipboardList, Sparkles, BarChart3, Plus, ArrowRight, Users, AlertTriangle, Copy, Mail, Send, Link2 } from 'lucide-react';
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
                <div className="flex justify-end gap-2 mt-4">
                  {p.status === 'aberta' && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/nr1/clima/${p.id}/responder`}>Responder</Link>
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
          <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1">
            <AlertTriangle className="h-3 w-3 mt-0.5" />
            Próxima entrega: dashboard com cálculo de correlação de Pearson entre dimensões e plano de ação integrado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
