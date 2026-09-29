import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, CalendarPlus, ChevronRight, FileText, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useFilaAnalise } from "@/hooks/useFilaAnalise";
import { toast } from "sonner";
import { useVagas } from "@/hooks/useVagas";
import { abrirCurriculo } from "@/hooks/useCandidatos";
import { useMoverCandidatura, useTriagem, type CandidaturaTriagem } from "@/hooks/useTriagem";
import {
  ETAPAS, ETAPA_COR, ETAPA_ENTREVISTA, ETAPA_LABEL, FONTE_LABEL, proximaEtapa, scoreClasse, type Etapa, type Recomendacao,
} from "@/config/recrutamento";
import { MoverDialog, type PedidoMover } from "./MoverDialog";
import { CandidatoDrawer } from "./CandidatoDrawer";

const dias = (d: string) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000));

type Props = { vagaInicial?: string | null; onVagaChange?: (id: string) => void };

export const TriagemKanban = ({ vagaInicial = null, onVagaChange }: Props) => {
  const { data: vagas = [], isLoading: carregandoVagas } = useVagas();
  const [vagaId, setVagaIdState] = useState<string | null>(null);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const ordenadas = useMemo(
    () => [...vagas].sort((a, b) => Number(b.status === "publicada") - Number(a.status === "publicada") || b.created_at.localeCompare(a.created_at)),
    [vagas]);
  useEffect(() => {
    if (vagaId || !ordenadas.length) return;
    const pedida = vagaInicial && ordenadas.find((v) => v.id === vagaInicial);
    setNaoEncontrada(!!vagaInicial && !pedida);
    setVagaIdState(pedida ? pedida.id : ordenadas[0].id);
  }, [ordenadas, vagaId, vagaInicial]);
  const setVagaId = (id: string) => { setVagaIdState(id); setNaoEncontrada(false); onVagaChange?.(id); };

  const { data: lista = [], isLoading, error } = useTriagem(vagaId);
  const mover = useMoverCandidatura(vagaId);
  const fila = useFilaAnalise(vagaId);
  const { data: papel } = useCurrentUserRole();
  const podeAnalisar = !!(papel?.isAdmin || papel?.isHR || papel?.isSuperAdmin);
  const [params, setParams] = useSearchParams();
  const filtro = (params.get("analise") === "com" || params.get("analise") === "sem") ? params.get("analise") as "com" | "sem" : "todos";
  const setFiltro = (f: "todos" | "com" | "sem") => setParams((p) => { const n = new URLSearchParams(p); if (f === "todos") n.delete("analise"); else n.set("analise", f); return n; }, { replace: true });
  const [confirmarLote, setConfirmarLote] = useState(false);
  const [reanalisar, setReanalisar] = useState<CandidaturaTriagem | null>(null);
  const [pedido, setPedido] = useState<PedidoMover | null>(null);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<Etapa | null>(null);
  const [abrindoCv, setAbrindoCv] = useState<string | null>(null);
  const aberto = lista.find((c) => c.id === abertoId) ?? null;

  const pedir = (c: CandidaturaTriagem, etapa: Etapa, origem: "agente" | "manual" = "manual", agendar = false) => {
    if (etapa === c.etapa && !agendar) return; // mesma coluna: nada a registrar
    setPedido({ id: c.id, nome: c.candidatos?.nome ?? "Candidato", etapaAtual: c.etapa, etapa, origem, agendar });
  };

  const confirmar = (p: PedidoMover, motivo: string, entrevistaEm: string | null) => {
    setPedido(null);
    mover.mutate({ id: p.id, etapa: p.etapa, motivo, origem: p.origem, entrevistaEm }, {
      onSuccess: () => toast.success(p.agendar ? "Entrevista agendada." : `Movido para ${ETAPA_LABEL[p.etapa]}.`),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível mover. Tente novamente."),
    });
  };

  const agendar = (c: CandidaturaTriagem, origem: "agente" | "manual" = "manual") =>
    ETAPA_ENTREVISTA.includes(c.etapa) ? pedir(c, c.etapa, origem, true) : pedir(c, "entrevista_rh", origem);

  const aplicar = (c: CandidaturaTriagem, r: Recomendacao) => {
    if (r === "arquivar") return pedir(c, "arquivado", "agente");
    if (r === "agendar_entrevista") return agendar(c, "agente");
    const prox = proximaEtapa(c.etapa);
    if (prox) pedir(c, prox, "agente");
  };

  const analisavel = (c: CandidaturaTriagem) => !!c.candidatos?.curriculo_url && c.etapa !== "arquivado";
  const pendentes = useMemo(() => lista.filter((c) => analisavel(c) && !c.analise_talent)
    .sort((a, b) => (a.etapa_desde ?? a.created_at).localeCompare(b.etapa_desde ?? b.created_at)), [lista]);
  const comAnalise = lista.filter((c) => c.analise_talent).length;
  const visiveis = filtro === "com" ? lista.filter((c) => c.analise_talent) : filtro === "sem" ? lista.filter((c) => !c.analise_talent) : lista;
  const rodarAnalise = (id: string) => fila.enfileirar([id]);
  const clicarSparkle = (c: CandidaturaTriagem) => (c.analise_talent ? setReanalisar(c) : rodarAnalise(c.id));
  const { lote } = fila;
  const feitos = lote.ok + lote.falhas + lote.semTexto;

  const verCv = async (c: CandidaturaTriagem) => {
    setAbrindoCv(c.id);
    try { await abrirCurriculo(c.candidato_id, c.candidatos?.nome ?? "Candidato"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Link expirado. Tente abrir novamente."); }
    finally { setAbrindoCv(null); }
  };

  if (carregandoVagas) return <Skeleton className="h-64 rounded-2xl" />;
  if (!vagas.length) return (
    <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">Crie ou publique uma vaga para ver o pipeline.</CardContent></Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-sm text-muted-foreground">Vaga</span>
        <Select value={vagaId ?? undefined} onValueChange={setVagaId}>
          <SelectTrigger className="rounded-xl sm:w-80" aria-label="Selecionar vaga do pipeline"><SelectValue placeholder="Selecione uma vaga" /></SelectTrigger>
          <SelectContent>{ordenadas.map((v) => <SelectItem key={v.id} value={v.id}>{v.titulo}{v.status !== "publicada" ? ` (${v.status})` : ""}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {podeAnalisar && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
          <div role="group" aria-label="Filtrar por análise" className="inline-flex rounded-full border p-0.5 bg-muted/40">
            {([["todos", `Todos (${lista.length})`], ["com", `Com análise (${comAnalise})`], ["sem", `Sem análise (${lista.length - comAnalise})`]] as const).map(([k, rot]) => (
              <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(k)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filtro === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{rot}</button>
            ))}
          </div>
          <Button size="sm" className="rounded-xl sm:ml-auto" disabled={!pendentes.length || fila.ocupado} onClick={() => setConfirmarLote(true)}>
            {fila.ocupado ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}Analisar currículos ({pendentes.length})
          </Button>
        </div>
      )}
      {(lote.ativo || lote.total > 0) && (
        <div className="rounded-xl border p-3 space-y-2" aria-live="polite">
          {lote.ativo ? (
            <>
              <p className="text-sm font-medium">Analisando {Math.min(feitos + 1, lote.total)}/{lote.total}</p>
              <Progress value={lote.total ? (feitos / lote.total) * 100 : 0} role="progressbar" aria-valuenow={feitos} aria-valuemin={0} aria-valuemax={lote.total} aria-label="Progresso da análise" />
            </>
          ) : (
            <p className="text-sm">Concluído: {lote.ok} analisado(s), {lote.falhas} falhou(aram), {lote.semTexto} sem texto extraível.</p>
          )}
        </div>
      )}
      {fila.pausa && <p role="alert" className="text-sm text-destructive">Fila pausada: {fila.pausa}</p>}
      {naoEncontrada && <p role="status" className="text-sm text-muted-foreground">Vaga não encontrada, exibindo a mais recente.</p>}

      {error && <p className="text-destructive text-sm">Não foi possível carregar o pipeline.</p>}
      {!isLoading && lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhum candidato nesta vaga ainda.</p>}

      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory motion-reduce:scroll-auto scroll-smooth" role="list" aria-label="Pipeline de triagem">
        {ETAPAS.map((etapa) => {
          const col = visiveis.filter((c) => c.etapa === etapa);
          return (
            <section key={etapa} role="listitem" aria-label={`Coluna ${ETAPA_LABEL[etapa]}, ${col.length} candidatos`}
              className={`snap-start shrink-0 w-[85vw] sm:w-72 rounded-2xl border border-t-4 ${ETAPA_COR[etapa]} bg-card p-3 space-y-3 ${sobre === etapa ? "ring-2 ring-primary" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setSobre(etapa); }}
              onDragLeave={() => setSobre((s) => (s === etapa ? null : s))}
              onDrop={(e) => {
                e.preventDefault(); setSobre(null);
                const c = lista.find((x) => x.id === e.dataTransfer.getData("text/plain"));
                if (c) pedir(c, etapa);
                setArrastando(null);
              }}>
              <header className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{ETAPA_LABEL[etapa]}</h3>
                <Badge variant="secondary" className="rounded-full">{col.length}</Badge>
              </header>
              {isLoading ? <Skeleton className="h-24 rounded-xl" /> : col.map((c) => {
                const prox = proximaEtapa(c.etapa);
                const st = fila.itens.get(c.id);
                return (
                  <article key={c.id} draggable aria-label={`Candidato ${c.candidatos?.nome}. Arraste para outra coluna ou use os botões.`}
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", c.id); setArrastando(c.id); }}
                    onDragEnd={() => setArrastando(null)}
                    className={`rounded-xl border bg-background p-3 space-y-2 shadow-sm cursor-grab ${arrastando === c.id ? "opacity-50" : ""}`}>
                    <button type="button" className="text-left w-full" onClick={() => setAbertoId(c.id)}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm truncate">{c.candidatos?.nome}</p>
                        {c.analise_talent && <Badge className={`rounded-full shrink-0 ${scoreClasse(c.analise_talent.match_score)}`}>{c.analise_talent.match_score}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {c.candidatos ? FONTE_LABEL[c.candidatos.fonte] : ""} · {dias(c.etapa_desde ?? c.created_at)} dia(s) na etapa
                      </p>
                      {c.entrevista_em && <p className="text-xs text-muted-foreground">Entrevista: {new Date(c.entrevista_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>}
                    </button>
                    {st && st.status !== "ok" && (
                      <div aria-live="polite" className="text-xs">
                        {st.status === "fila" && <span className="text-muted-foreground">Na fila…</span>}
                        {st.status === "analisando" && <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{st.lento ? "Demorando mais que o normal…" : "Analisando…"}</span>}
                        {st.status === "erro" && (
                          <div className="space-y-1">
                            <p className="text-destructive">{st.erro}</p>
                            {podeAnalisar && <Button size="sm" variant="outline" className="h-7 px-2 rounded-lg" disabled={fila.ocupado && !!fila.pausa} onClick={() => rodarAnalise(c.id)}><RotateCcw className="h-3 w-3 mr-1" />Tentar novamente</Button>}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {c.candidatos?.curriculo_url && (
                        <Button size="sm" variant="ghost" className="h-7 px-2" disabled={abrindoCv === c.id} onClick={() => verCv(c)} aria-label="Ver currículo">
                          {abrindoCv === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                      {podeAnalisar && c.etapa !== "arquivado" && (c.candidatos?.curriculo_url ? (
                        <Button size="sm" variant="ghost" className="h-7 px-2" disabled={st?.status === "fila" || st?.status === "analisando"} onClick={() => clicarSparkle(c)}
                          aria-label={`${c.analise_talent ? "Reanalisar" : "Analisar"} currículo de ${c.candidatos?.nome ?? "candidato"}`}>
                          <Sparkles className="h-3.5 w-3.5 mr-0.5" />{c.analise_talent ? "Reanalisar" : "Analisar"}
                        </Button>
                      ) : (
                        <Tooltip><TooltipTrigger asChild><span tabIndex={0} className="inline-flex h-7 items-center px-2 text-muted-foreground/60" aria-label="Sem currículo para analisar"><Sparkles className="h-3.5 w-3.5" /></span></TooltipTrigger><TooltipContent>Sem currículo para analisar</TooltipContent></Tooltip>
                      ))}
                      {prox && <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => pedir(c, prox)} aria-label={`Avançar para ${ETAPA_LABEL[prox]}`}><ChevronRight className="h-3.5 w-3.5 mr-0.5" />Avançar</Button>}
                      {c.etapa !== "arquivado" && c.etapa !== "contratado" && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => agendar(c)} aria-label="Agendar entrevista"><CalendarPlus className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => pedir(c, "arquivado")} aria-label="Arquivar"><Archive className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>

      <MoverDialog pedido={pedido} onClose={() => setPedido(null)} onConfirm={confirmar} enviando={mover.isPending} />
      <CandidatoDrawer c={aberto} onClose={() => setAbertoId(null)}
        analisando={!!aberto && ["fila", "analisando"].includes(fila.itens.get(aberto.id)?.status ?? "")}
        erroAnalise={aberto ? fila.itens.get(aberto.id)?.erro ?? null : null}
        onAnalisar={() => aberto && rodarAnalise(aberto.id)}
        onAplicar={(r) => aberto && aplicar(aberto, r)} />
      <AlertDialog open={confirmarLote} onOpenChange={setConfirmarLote}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analisar {pendentes.length} currículo(s)?</AlertDialogTitle>
            <AlertDialogDescription>Consome créditos de IA. O agente só sugere; ninguém muda de etapa sozinho.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={fila.ocupado} onClick={() => { setConfirmarLote(false); fila.enfileirar(pendentes.map((c) => c.id), true); }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!reanalisar} onOpenChange={(o) => !o && setReanalisar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reanalisar {reanalisar?.candidatos?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>Substitui a análise anterior e consome créditos. A reanálise fica registrada no histórico.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (reanalisar) rodarAnalise(reanalisar.id); setReanalisar(null); }}>Reanalisar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
