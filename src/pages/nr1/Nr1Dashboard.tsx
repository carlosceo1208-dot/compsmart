import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, FileText, Users, ShieldCheck, ArrowRight, History, Pencil, Trash2, Plus, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNr1Diagnosticos, useNr1Subscription, useUpdateNr1Diagnostico, useDeleteNr1Diagnostico } from '@/hooks/useNr1';
import { DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';
import { Nr1SeloSaude, Nr1SeloRodape } from '@/components/nr1/Nr1SeloSaude';
import { GRAU_RISCO_INSS, type GrauRiscoInss } from '@/lib/nr1Risco';
import { Skeleton } from '@/components/ui/skeleton';
import { GrauRiscoInssCard } from '@/components/nr1/GrauRiscoInssCard';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Nr1Dashboard() {
  const { data: sub, isLoading: subLoading } = useNr1Subscription();
  const { data: diagnosticos, isLoading: diagLoading } = useNr1Diagnosticos();

  const updateMut = useUpdateNr1Diagnostico();
  const deleteMut = useDeleteNr1Diagnostico();
  const [editing, setEditing] = useState<{ id: string; nome: string } | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; nome: string } | null>(null);

  const ultimo = diagnosticos?.[0];
  const concluidos = diagnosticos?.filter((d) => d.status === 'concluido').length ?? 0;
  const grau = (sub as any)?.grau_risco_inss as GrauRiscoInss | null | undefined;
  const grauInfo = grau ? GRAU_RISCO_INSS[grau] : null;

  return (
    <div className="space-y-6">
      {/* Status da assinatura */}
      {subLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !sub ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <h3 className="font-semibold">Sua empresa ainda não ativou o módulo NR-1</h3>
            <p className="text-sm text-muted-foreground">
              Conformidade legal, plano de ação e monitoramento de riscos psicossociais.
              Fale com o nosso time para conhecer as condições.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card id="plano-essencial" className="nr1-bg-soft border-[hsl(var(--nr1-primary)/0.2)] scroll-mt-6">
          <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 nr1-text-primary" />
              <div>
                <p className="font-semibold">
                  Plano {sub.plan_tier === 'pro' ? 'NR-1 Pro' : 'NR-1 Essencial'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">Status: {sub.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Conformidade Ativa</Badge>
              <Button asChild size="sm" className="nr1-bg-primary">
                <Link to="/nr1/matriz-risco">Abrir Matriz de Risco <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grau de Risco INSS + Plano de Ação */}
      <GrauRiscoInssCard />


      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          icon={FileText}
          label="Diagnósticos realizados"
          value={diagLoading ? '—' : String(concluidos)}
        />
        <KpiCard
          icon={Users}
          label="Último ciclo"
          value={diagLoading ? '—' : ultimo ? `${ultimo.total_respondentes} respondentes` : 'Nenhum'}
        />
        <KpiCard
          icon={Activity}
          label="Nível de risco atual"
          value={
            grauInfo ? (
              <Badge className={`${grauInfo.bg} ${grauInfo.cor} border`}>
                Grau {grauInfo.grau} · {grauInfo.label}
              </Badge>
             ) : ultimo && ultimo.total_respondentes >= 5 && ultimo.score_geral != null ? (
              <Nr1SeloSaude risco={ultimo.score_geral} />
            ) : (
              '—'
            )
          }
        />
      </div>

      {/* Último diagnóstico */}
      {ultimo && ultimo.status === 'concluido' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Último Diagnóstico — {ultimo.ciclo_nome}</CardTitle>
              <CardDescription>
                 {ultimo.total_respondentes < 5 ? 'Dados insuficientes — mínimo de 5 participantes' : `Score geral: ${ultimo.score_geral?.toFixed(1) ?? '—'}/100`}
              </CardDescription>
              <Nr1SeloRodape className="mt-1" />
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/nr1/diagnostico/${ultimo.id}`}>Ver relatório <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ultimo.total_respondentes >= 5 && ultimo.scores_dimensao && typeof ultimo.scores_dimensao === 'object' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(ultimo.scores_dimensao as Record<string, number>).map(([dim, score]) => (
                  <div key={dim} className="flex items-center justify-between p-3 rounded-md border">
                    <span className="text-sm font-medium">
                      {DIMENSAO_LABEL[dim as Dimensao] ?? dim}
                    </span>
                    <span className="text-sm tabular-nums">{Number(score).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{ultimo.total_respondentes < 5 ? 'Dados insuficientes para exibir resultados por dimensão.' : 'Sem dados por dimensão.'}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ciclos & Comparação */}
      {(diagnosticos?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 nr1-text-primary" />
                Ciclos de Diagnóstico ({diagnosticos?.length ?? 0})
              </CardTitle>
              <CardDescription className="text-xs">
                Edite, exclua ciclos vazios ou crie um novo. A comparação entre ciclos fica no Histórico.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" className="nr1-bg-primary">
                <Link to="/nr1/diagnostico/novo"><Plus className="h-3.5 w-3.5 mr-1" />Novo ciclo</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/nr1/diagnosticos">Ver histórico completo <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de todos os ciclos com ações */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(diagnosticos ?? []).map((c) => {
                const vazio = !c.total_respondentes || c.total_respondentes === 0;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between gap-2 p-3 rounded-md border ${vazio ? 'bg-muted/30 border-dashed' : 'hover:bg-muted/50'} transition`}
                  >
                    <Link to={`/nr1/diagnostico/${c.id}`} className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.ciclo_nome}</p>
                      <p className="text-xs text-muted-foreground">
                         {c.total_respondentes ?? 0} resp · {c.total_respondentes < 5 ? 'Dados insuficientes' : `Score ${c.score_geral?.toFixed(1) ?? '—'}`}
                        {vazio && <span className="ml-1 text-amber-600">· vazio</span>}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.score_geral != null && !vazio && (c.total_respondentes ?? 0) >= 5 && (
                        <Nr1SeloSaude risco={c.score_geral} mostrarNota={false} className="hidden md:inline-flex" />
                      )}
                      {!vazio && (
                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Plano de ação"
                        >
                          <Link to={`/nr1/diagnostico/${c.id}#plano-acao`}>
                            <ClipboardList className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditing({ id: c.id, nome: c.ciclo_nome })}
                        title="Renomear"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleting({ id: c.id, nome: c.ciclo_nome })}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA inicial se não houver diagnóstico */}
      {!diagLoading && (!diagnosticos || diagnosticos.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto nr1-text-primary" />
            <h3 className="font-semibold">Você ainda não realizou nenhum diagnóstico</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              O primeiro passo da NR-1 é mapear riscos psicossociais com um questionário científico aplicado aos colaboradores.
            </p>
            <Button asChild className="nr1-bg-primary">
              <Link to="/nr1/diagnostico/novo">Iniciar primeiro diagnóstico</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Editar ciclo */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear ciclo</DialogTitle>
            <DialogDescription>Atualize o nome do ciclo de diagnóstico.</DialogDescription>
          </DialogHeader>
          <Input
            value={editing?.nome ?? ''}
            onChange={(e) => setEditing((s) => (s ? { ...s, nome: e.target.value } : s))}
            placeholder="Ex.: Maio 2026"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button
              className="nr1-bg-primary"
              disabled={!editing?.nome?.trim() || updateMut.isPending}
              onClick={async () => {
                if (!editing) return;
                await updateMut.mutateAsync({ id: editing.id, ciclo_nome: editing.nome.trim() });
                setEditing(null);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excluir ciclo */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ciclo "{deleting?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as respostas associadas serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return;
                await deleteMut.mutateAsync(deleting.id);
                setDeleting(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg nr1-bg-soft flex items-center justify-center">
            <Icon className="h-5 w-5 nr1-text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="text-lg font-semibold">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
