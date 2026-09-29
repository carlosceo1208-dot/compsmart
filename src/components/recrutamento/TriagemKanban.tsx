import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, CalendarPlus, ChevronRight, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useVagas } from "@/hooks/useVagas";
import { abrirCurriculo } from "@/hooks/useCandidatos";
import { useAnalisarCurriculo, useMoverCandidatura, useTriagem, type CandidaturaTriagem } from "@/hooks/useTriagem";
import {
  ETAPAS, ETAPA_COR, ETAPA_ENTREVISTA, ETAPA_LABEL, FONTE_LABEL, proximaEtapa, scoreClasse, type Etapa, type Recomendacao,
} from "@/config/recrutamento";
import { MoverDialog, type PedidoMover } from "./MoverDialog";
import { CandidatoDrawer } from "./CandidatoDrawer";

const dias = (d: string) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000));

export const TriagemKanban = () => {
  const { data: vagas = [], isLoading: carregandoVagas } = useVagas();
  const [vagaId, setVagaId] = useState<string | null>(null);
  const ordenadas = useMemo(
    () => [...vagas].sort((a, b) => Number(b.status === "publicada") - Number(a.status === "publicada") || b.created_at.localeCompare(a.created_at)),
    [vagas]);
  useEffect(() => { if (!vagaId && ordenadas.length) setVagaId(ordenadas[0].id); }, [ordenadas, vagaId]);

  const { data: lista = [], isLoading, error } = useTriagem(vagaId);
  const mover = useMoverCandidatura(vagaId);
  const analisar = useAnalisarCurriculo(vagaId);
  const [pedido, setPedido] = useState<PedidoMover | null>(null);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
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

  const rodarAnalise = (id: string) => {
    if (analisar.isPending) return;
    setErros((e) => ({ ...e, [id]: "" }));
    analisar.mutate(id, {
      onSuccess: () => toast.success("Análise concluída."),
      onError: (e) => setErros((x) => ({ ...x, [id]: e instanceof Error ? e.message : "Falha na análise." })),
    });
  };

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

      {error && <p className="text-destructive text-sm">Não foi possível carregar o pipeline.</p>}
      {!isLoading && lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhum candidato nesta vaga ainda.</p>}

      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory motion-reduce:scroll-auto scroll-smooth" role="list" aria-label="Pipeline de triagem">
        {ETAPAS.map((etapa) => {
          const col = lista.filter((c) => c.etapa === etapa);
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
                    <div className="flex flex-wrap gap-1">
                      {c.candidatos?.curriculo_url && (
                        <Button size="sm" variant="ghost" className="h-7 px-2" disabled={abrindoCv === c.id} onClick={() => verCv(c)} aria-label="Ver currículo">
                          {abrindoCv === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                        </Button>
                      )}
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
        analisando={analisar.isPending && analisar.variables === aberto?.id}
        erroAnalise={aberto ? erros[aberto.id] || null : null}
        onAnalisar={() => aberto && rodarAnalise(aberto.id)}
        onAplicar={(r) => aberto && aplicar(aberto, r)} />
    </div>
  );
};
