import { useMemo, useState } from 'react';
import { Handshake, Lock, Plus, Pencil, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency, formatDecimal } from '@/lib/formatters';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import {
  DIAGNOSTICO_STATUS_LABELS,
  ORIGEM_LABELS,
  PROJETO_STATUS_LABELS,
  useRhConsultores,
  useRhDiagnosticoDetalhe,
  useRhDiagnosticos,
  useRhHoras,
  useRhProjetos,
  useRhServiceAccess,
  type Consultor,
  type RhProjeto,
  type RhHora,
} from '@/hooks/useRhService';
import { ConsultorDialog } from '@/components/rh-service/ConsultorDialog';
import { ProjetoDialog } from '@/components/rh-service/ProjetoDialog';
import { HoraDialog } from '@/components/rh-service/HoraDialog';

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return '—';
  return `${day}/${month}/${year}`;
};

const formatHoras = (value: number | null) => (value === null ? '—' : `${formatDecimal(value, 1)} h`);

const EmptyRow = ({ colSpan, message }: { colSpan: number; message: string }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center text-sm text-muted-foreground py-8">
      {message}
    </TableCell>
  </TableRow>
);

const TableSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

const RhService = () => {
  const access = useRhServiceAccess();
  const moduleAccess = useModuleAccess();
  const canRead = access.canReadRhService;
  const canWrite = access.isRhServiceEditor;

  const consultores = useRhConsultores(canRead);
  const projetos = useRhProjetos(canRead);
  const horas = useRhHoras(canRead);
  const diagnosticos = useRhDiagnosticos(canRead);

  const [consultorDialog, setConsultorDialog] = useState<{ open: boolean; consultor: Consultor | null }>({
    open: false,
    consultor: null,
  });
  const [projetoDialog, setProjetoDialog] = useState<{ open: boolean; projeto: RhProjeto | null }>({
    open: false,
    projeto: null,
  });
  const [horaDialog, setHoraDialog] = useState<{ open: boolean; hora: RhHora | null }>({
    open: false,
    hora: null,
  });
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const detalhe = useRhDiagnosticoDetalhe(detalheId);
  const diagnosticoSelecionado = useMemo(
    () => (diagnosticos.data ?? []).find((item) => item.id === detalheId) ?? null,
    [diagnosticos.data, detalheId],
  );

  if (access.loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            O RH Service está disponível apenas para o administrador e o RH da empresa, além da equipe CompSmart.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Handshake className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">RH Service</CardTitle>
                <CardDescription>
                  Consultoria com consultores seniores por projeto, com diagnóstico de maturidade e controle de horas.
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full w-fit">
              {canWrite ? 'Equipe CompSmart' : 'Consulta'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="consultores" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="consultores">Consultores</TabsTrigger>
          <TabsTrigger value="projetos">Projetos</TabsTrigger>
          <TabsTrigger value="horas">Horas</TabsTrigger>
          <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
        </TabsList>

        {/* Consultores */}
        <TabsContent value="consultores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Consultores vinculados</CardTitle>
                <CardDescription>Especialistas seniores designados para a empresa.</CardDescription>
              </div>
              {canWrite && (
                <Button size="sm" onClick={() => setConsultorDialog({ open: true, consultor: null })}>
                  <Plus className="h-4 w-4" />
                  Novo consultor
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {consultores.isLoading ? (
                <TableSkeleton />
              ) : consultores.error ? (
                <Alert variant="destructive">
                  <AlertDescription>Não foi possível carregar os consultores.</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Especialidade</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Bio</TableHead>
                        <TableHead>Situação</TableHead>
                        {canWrite && <TableHead className="text-right">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(consultores.data ?? []).length === 0 ? (
                        <EmptyRow colSpan={canWrite ? 6 : 5} message="Nenhum consultor vinculado ainda." />
                      ) : (
                        (consultores.data ?? []).map((consultor) => (
                          <TableRow key={consultor.id}>
                            <TableCell className="font-medium">{consultor.nome}</TableCell>
                            <TableCell>{consultor.especialidade ?? '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{consultor.email}</TableCell>
                            <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                              {consultor.bio ?? '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={consultor.ativo ? 'default' : 'secondary'} className="rounded-full">
                                {consultor.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            {canWrite && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setConsultorDialog({ open: true, consultor })}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projetos */}
        <TabsContent value="projetos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Projetos de consultoria</CardTitle>
                <CardDescription>Escopo negociado por projeto, sem tabela fixa de preços.</CardDescription>
              </div>
              {canWrite && (
                <Button size="sm" onClick={() => setProjetoDialog({ open: true, projeto: null })}>
                  <Plus className="h-4 w-4" />
                  Novo projeto
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {projetos.isLoading ? (
                <TableSkeleton />
              ) : projetos.error ? (
                <Alert variant="destructive">
                  <AlertDescription>Não foi possível carregar os projetos.</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Consultor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Horas estimadas</TableHead>
                        <TableHead>Valor negociado</TableHead>
                        <TableHead>Período</TableHead>
                        {canWrite && <TableHead className="text-right">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(projetos.data ?? []).length === 0 ? (
                        <EmptyRow colSpan={canWrite ? 7 : 6} message="Nenhum projeto registrado ainda." />
                      ) : (
                        (projetos.data ?? []).map((projeto) => (
                          <TableRow key={projeto.id}>
                            <TableCell className="font-medium">{projeto.titulo}</TableCell>
                            <TableCell>{projeto.consultores?.nome ?? '—'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="rounded-full">
                                {PROJETO_STATUS_LABELS[projeto.status] ?? projeto.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatHoras(projeto.horas_estimadas)}</TableCell>
                            <TableCell>
                              {projeto.valor_negociado === null ? 'A negociar' : formatCurrency(projeto.valor_negociado)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(projeto.data_inicio)} — {formatDate(projeto.data_fim)}
                            </TableCell>
                            {canWrite && (
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => setProjetoDialog({ open: true, projeto })}>
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Horas */}
        <TabsContent value="horas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Horas de consultoria</CardTitle>
                <CardDescription>Registro das horas aplicadas em cada projeto.</CardDescription>
              </div>
              {canWrite && (
                <Button
                  size="sm"
                  disabled={(projetos.data ?? []).length === 0}
                  onClick={() => setHoraDialog({ open: true, hora: null })}
                >
                  <Plus className="h-4 w-4" />
                  Registrar horas
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {horas.isLoading ? (
                <TableSkeleton />
              ) : horas.error ? (
                <Alert variant="destructive">
                  <AlertDescription>Não foi possível carregar as horas.</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Consultor</TableHead>
                        <TableHead>Horas</TableHead>
                        <TableHead>Descrição</TableHead>
                        {canWrite && <TableHead className="text-right">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(horas.data ?? []).length === 0 ? (
                        <EmptyRow colSpan={canWrite ? 6 : 5} message="Nenhuma hora registrada ainda." />
                      ) : (
                        (horas.data ?? []).map((hora) => (
                          <TableRow key={hora.id}>
                            <TableCell>{formatDate(hora.data)}</TableCell>
                            <TableCell className="font-medium">{hora.rh_service_projetos?.titulo ?? '—'}</TableCell>
                            <TableCell>{hora.consultores?.nome ?? '—'}</TableCell>
                            <TableCell>{formatHoras(hora.horas)}</TableCell>
                            <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                              {hora.descricao ?? '—'}
                            </TableCell>
                            {canWrite && (
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => setHoraDialog({ open: true, hora })}>
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diagnósticos */}
        <TabsContent value="diagnosticos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Diagnósticos de maturidade de RH</CardTitle>
              <CardDescription>
                Aplicados pelo consultor sênior; abra o detalhe para ver práticas, níveis e módulos recomendados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {diagnosticos.isLoading ? (
                <TableSkeleton />
              ) : diagnosticos.error ? (
                <Alert variant="destructive">
                  <AlertDescription>Não foi possível carregar os diagnósticos.</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Consultor</TableHead>
                        <TableHead>Maturidade</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Detalhe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(diagnosticos.data ?? []).length === 0 ? (
                        <EmptyRow colSpan={7} message="Nenhum diagnóstico aplicado ainda." />
                      ) : (
                        (diagnosticos.data ?? []).map((diagnostico) => (
                          <TableRow key={diagnostico.id}>
                            <TableCell>{formatDate(diagnostico.created_at)}</TableCell>
                            <TableCell className="font-medium">
                              {diagnostico.rh_service_projetos?.titulo ?? '—'}
                            </TableCell>
                            <TableCell>{diagnostico.consultores?.nome ?? '—'}</TableCell>
                            <TableCell>
                              {diagnostico.maturidade === null ? '—' : `${formatDecimal(diagnostico.maturidade, 0)}/100`}
                            </TableCell>
                            <TableCell>{diagnostico.nivel ?? '—'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="rounded-full">
                                {DIAGNOSTICO_STATUS_LABELS[diagnostico.status] ?? diagnostico.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setDetalheId(diagnostico.id)}>
                                <Eye className="h-4 w-4" />
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detalhe do diagnóstico */}
      <Sheet open={!!detalheId} onOpenChange={(open) => !open && setDetalheId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhe do diagnóstico</SheetTitle>
            <SheetDescription>
              {diagnosticoSelecionado?.rh_service_projetos?.titulo ?? 'Sem projeto vinculado'}
              {diagnosticoSelecionado?.consultores?.nome ? ` • ${diagnosticoSelecionado.consultores.nome}` : ''}
            </SheetDescription>
          </SheetHeader>

          {detalhe.isLoading ? (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : detalhe.error ? (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>Não foi possível carregar o detalhe do diagnóstico.</AlertDescription>
            </Alert>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Práticas avaliadas</h3>
                {(detalhe.data?.scores ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma prática pontuada neste diagnóstico.</p>
                ) : (
                  (detalhe.data?.scores ?? []).map((score) => (
                    <div key={score.id} className="rounded-xl border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{score.pratica}</p>
                        <span className="text-sm font-semibold">{formatDecimal(score.score, 0)}/100</span>
                      </div>
                      <Progress value={Number(score.score)} className="h-2" />
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{score.nivel ?? 'Nível não calculado'}</span>
                        {score.module_slug && <span>{moduleAccess.getModuleName(score.module_slug)}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Módulos recomendados</h3>
                {(detalhe.data?.recomendacoes ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum módulo recomendado neste diagnóstico.</p>
                ) : (
                  (detalhe.data?.recomendacoes ?? []).map((reco) => (
                    <div key={reco.id} className="rounded-xl border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{moduleAccess.getModuleName(reco.module_slug)}</p>
                        <Badge variant="outline" className="rounded-full">
                          {ORIGEM_LABELS[reco.origem] ?? reco.origem}
                        </Badge>
                      </div>
                      {reco.pratica && <p className="text-xs text-muted-foreground">Prática: {reco.pratica}</p>}
                      <p className="text-sm text-muted-foreground">
                        {reco.justificativa ?? 'Sem justificativa registrada.'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {canWrite && (
        <>
          <ConsultorDialog
            open={consultorDialog.open}
            consultor={consultorDialog.consultor}
            onOpenChange={(open) => setConsultorDialog({ open, consultor: open ? consultorDialog.consultor : null })}
          />
          <ProjetoDialog
            open={projetoDialog.open}
            projeto={projetoDialog.projeto}
            consultores={consultores.data ?? []}
            onOpenChange={(open) => setProjetoDialog({ open, projeto: open ? projetoDialog.projeto : null })}
          />
          <HoraDialog
            open={horaDialog.open}
            hora={horaDialog.hora}
            projetos={projetos.data ?? []}
            consultores={consultores.data ?? []}
            onOpenChange={(open) => setHoraDialog({ open, hora: open ? horaDialog.hora : null })}
          />
        </>
      )}
    </div>
  );
};

export default RhService;
