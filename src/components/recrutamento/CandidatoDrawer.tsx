import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { ETAPA_LABEL, RECOMENDACAO_LABEL, scoreClasse, type Etapa, type Recomendacao } from "@/config/recrutamento";
import { useHistorico, type CandidaturaTriagem } from "@/hooks/useTriagem";

const fmt = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const CandidatoDrawer = ({ c, onClose, analisando, erroAnalise, onAnalisar, onAplicar }: {
  c: CandidaturaTriagem | null; onClose: () => void; analisando: boolean; erroAnalise: string | null;
  onAnalisar: () => void; onAplicar: (r: Recomendacao) => void;
}) => {
  const { data: historico = [], isLoading } = useHistorico(c?.id ?? null);
  const a = c?.analise_talent;
  return (
    <Sheet open={!!c} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {c && (
          <>
            <SheetHeader>
              <SheetTitle>{c.candidatos?.nome}</SheetTitle>
              <SheetDescription>{ETAPA_LABEL[c.etapa]}{c.entrevista_em ? ` · entrevista ${fmt(c.entrevista_em)}` : ""}</SheetDescription>
            </SheetHeader>
            <Tabs defaultValue="analise" className="mt-4">
              <TabsList className="w-full"><TabsTrigger value="analise" className="flex-1">Análise</TabsTrigger><TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger></TabsList>

              <TabsContent value="analise" className="space-y-4 pt-2">
                {c.motivo_arquivamento && <p className="text-sm text-muted-foreground">Motivo do arquivamento: {c.motivo_arquivamento}</p>}
                {erroAnalise && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription className="space-y-2">
                      <p>{erroAnalise}</p>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={onAnalisar} disabled={analisando}><RotateCcw className="h-3.5 w-3.5 mr-1" />Tentar novamente</Button>
                    </AlertDescription>
                  </Alert>
                )}
                {!a ? (
                  <div className="rounded-2xl border p-4 text-center space-y-3">
                    <Bot className="h-8 w-8 mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">{analisando ? "O agente Talent está lendo o currículo…" : "Ainda sem análise. O agente compara o currículo (sem dados pessoais) com a vaga e sugere o próximo passo."}</p>
                    <Button className="rounded-xl" onClick={onAnalisar} disabled={analisando || !c.candidatos?.curriculo_url}>
                      {analisando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      {analisando ? "Analisando…" : "Analisar currículo"}
                    </Button>
                    {!c.candidatos?.curriculo_url && <p className="text-xs text-muted-foreground">Sem currículo anexado.</p>}
                  </div>
                ) : (
                  <div className="rounded-2xl border p-4 space-y-3" aria-label="Análise do Agente Talent">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-primary" />Análise do Agente Talent</p>
                      <Badge className={`rounded-full ${scoreClasse(a.match_score)}`}>Match {a.match_score}</Badge>
                    </div>
                    <Lista titulo="Pontos fortes" itens={a.pontos_fortes} />
                    <Lista titulo="Lacunas" itens={a.gaps} />
                    <p className="text-sm">{a.justificativa}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-sm text-muted-foreground">Recomendação:</span>
                      <Badge variant="outline" className="rounded-full">{RECOMENDACAO_LABEL[a.recomendacao]}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="rounded-xl" disabled={c.etapa === "arquivado" || c.etapa === "contratado"} onClick={() => onAplicar(a.recomendacao)}>Aplicar: {RECOMENDACAO_LABEL[a.recomendacao]}</Button>
                      <Button size="sm" variant="ghost" className="rounded-xl" onClick={onAnalisar} disabled={analisando}>
                        {analisando ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1" />}Analisar de novo
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Sugestão do agente{c.analise_em ? ` em ${fmt(c.analise_em)}` : ""}. A decisão é sempre do RH.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="historico" className="pt-2">
                {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : historico.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
                ) : (
                  <ol className="space-y-3" aria-label="Histórico de decisões">
                    {historico.map((h) => (
                      <li key={h.id} className="rounded-xl border p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{h.etapa_anterior && h.etapa_anterior !== h.etapa_nova ? `${ETAPA_LABEL[h.etapa_anterior as Etapa]} → ` : ""}{ETAPA_LABEL[h.etapa_nova as Etapa]}</span>
                          <Badge variant={h.origem === "agente" ? "default" : "secondary"} className="rounded-full">{h.origem === "agente" ? "Agente" : "Manual"}</Badge>
                        </div>
                        {h.motivo && <p>{h.motivo}</p>}
                        <p className="text-xs text-muted-foreground">{h.responsavel} · {fmt(h.criado_em)}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const Lista = ({ titulo, itens }: { titulo: string; itens: string[] }) => (
  <div>
    <p className="text-sm font-medium">{titulo}</p>
    <ul className="list-disc pl-5 text-sm text-muted-foreground">{itens.map((i, k) => <li key={k}>{i}</li>)}</ul>
  </div>
);
