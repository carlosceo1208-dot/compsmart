import { Fragment, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Printer, AlertTriangle } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  DIMENSOES, LIKERT, RECOMENDACOES, ROADMAP_90, fraseDoNivel, montarScorecard, corDoScore, type DimMedia,
} from "@/lib/maturidade";
import { STATUS_LABEL, useMaturidadeEmpresas } from "./MaturidadeLista";

const fmt = (n: number | null, d = 2) => (n == null ? "sem dados" : n.toFixed(d).replace(".", ","));
const COR: Record<string, string> = {
  critico: "bg-destructive/15 text-destructive",
  alerta: "bg-warning/20 text-foreground",
  sucesso: "bg-success/15 text-success",
  muted: "bg-muted text-muted-foreground",
};
const TOTAL_RH = 36; // afirmações RH + Ambos
const TOTAL_G = 26; // afirmações Gestores + Ambos

export default function MaturidadeDetalhe() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const empresas = useMaturidadeEmpresas();
  const [email, setEmail] = useState("");
  const [respG, setRespG] = useState<Record<string, number>>({});

  const diag = useQuery({
    queryKey: ["maturidade-diag", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("maturidade_diagnosticos").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const convites = useQuery({
    queryKey: ["maturidade-convites", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("maturidade_convidados").select("id,email,token,status,expira_em").eq("diagnostico_id", id).order("criado_em");
      if (error) throw error;
      return data ?? [];
    },
  });
  const qGestor = useQuery({
    queryKey: ["maturidade-q-gestor", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("maturidade_questoes_gestor", { p_diagnostico: id });
      if (error) throw error;
      return data ?? [];
    },
  });
  const score = useQuery({
    queryKey: ["maturidade-score", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("maturidade_scorecard", { p_diagnostico: id });
      if (error) throw error;
      return data as { rh_convidados: number; rh_respondidos: number; gestores_completos: number; dimensoes: DimMedia[] };
    },
  });

  const card = useMemo(() => montarScorecard(score.data?.dimensoes ?? []), [score.data]);
  const refresh = () => ["maturidade-diag", "maturidade-convites", "maturidade-score"].forEach((k) => qc.invalidateQueries({ queryKey: [k, id] }));

  const convidar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("maturidade_convidados").insert({ diagnostico_id: id, email: email.trim().toLowerCase() });
      if (error) throw error;
      if (diag.data?.status === "rascunho") await supabase.from("maturidade_diagnosticos").update({ status: "coletando" }).eq("id", id);
    },
    onSuccess: () => { setEmail(""); refresh(); toast({ title: "Convite criado", description: "Copie o link e envie ao RH." }); },
    onError: () => toast({ title: "E-mail inválido", variant: "destructive" }),
  });
  const registrarGestor = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("maturidade_registrar_gestor", { p_diagnostico: id, p_respostas: respG });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => { setRespG({}); refresh(); toast({ title: `Gestor ${n} registrado` }); },
    onError: () => toast({ title: "Não foi possível registrar", description: "Responda todas as afirmações.", variant: "destructive" }),
  });
  const concluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("maturidade_diagnosticos").update({ status: "concluido", concluido_em: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  if (diag.isLoading) return null;
  if (!diag.data) return <p className="p-6 text-muted-foreground">Diagnóstico não encontrado ou sem permissão.</p>;
  const d = diag.data;
  const empresaNome = empresas.data?.find((e) => e.id === d.root_company_id)?.nome ?? "—";
  const s = score.data;
  const naoFinalizado = !s || s.rh_respondidos === 0 || s.gestores_completos === 0 || d.status !== "concluido";
  const linkDe = (t: string) => `${window.location.origin}/maturidade/responder/${t}`;
  const radarData = card.dims.map((x) => ({ dim: `D${x.n}`, RH: x.rh ?? 0, Gestores: x.gestores ?? 0 }));
  const completoG = qGestor.data != null && Object.keys(respG).length === qGestor.data.length;

  return (
    <div className="space-y-6 p-4 md:p-6 print:p-0">
      <div className="print:hidden">
        <Link to="/consultoria/maturidade" className="text-sm text-muted-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Diagnósticos</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{d.nome_projeto}</h1>
            <p className="text-sm text-muted-foreground">{empresaNome}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">{STATUS_LABEL[d.status]}</Badge>
            {d.status !== "concluido" && <Button variant="outline" size="sm" onClick={() => concluir.mutate()}>Concluir coleta</Button>}
          </div>
        </div>
        <p className="mt-3 text-sm text-foreground">
          RH: {s?.rh_respondidos ?? 0}/{s?.rh_convidados ?? 0} respondidos ({TOTAL_RH} afirmações cada) · Gestores: {s?.gestores_completos ?? 0} respondidos ({TOTAL_G} afirmações cada)
        </p>
        {naoFinalizado && (
          <p className="mt-2 text-sm flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4 text-warning" /> Diagnóstico ainda não finalizado — os números podem mudar.</p>
        )}
      </div>

      <Tabs defaultValue="coleta">
        <TabsList className="print:hidden flex-wrap h-auto">
          <TabsTrigger value="coleta">Coleta</TabsTrigger>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap 90 dias</TabsTrigger>
        </TabsList>

        <TabsContent value="coleta" className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Convidar RH (autoavaliação online)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input type="email" placeholder="email@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} disabled={d.status === "concluido"} />
                <Button onClick={() => convidar.mutate()} disabled={!email.includes("@") || convidar.isPending || d.status === "concluido"}>Gerar link</Button>
              </div>
              <ul className="divide-y">
                {convites.data?.map((c) => (
                  <li key={c.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-foreground">{c.email}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant={c.status === "respondido" ? "default" : "secondary"} className="rounded-full">{c.status === "respondido" ? "Respondido" : "Pendente"}</Badge>
                      {c.status === "pendente" && (
                        <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(linkDe(c.token)); toast({ title: "Link copiado" }); }}><Copy className="h-4 w-4 mr-1" /> Copiar link</Button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Registrar gestor {((s?.gestores_completos ?? 0) + 1)} (anônimo)</CardTitle>
              <p className="text-sm text-muted-foreground">Sem nome nem e-mail. Só a média do grupo aparece no relatório.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {qGestor.data?.map((q) => (
                <div key={q.id} className="rounded-xl border p-3">
                  <p className="text-sm text-foreground">{q.numero}. {q.afirmacao}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {LIKERT.map((o) => (
                      <Button key={o.v} size="sm" variant={respG[q.id] === o.v ? "default" : "outline"} title={o.label} onClick={() => setRespG({ ...respG, [q.id]: o.v })}>{o.v}</Button>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={() => registrarGestor.mutate()} disabled={!completoG || registrarGestor.isPending || d.status === "concluido"}>
                Salvar gestor ({Object.keys(respG).length}/{qGestor.data?.length ?? TOTAL_G})
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scorecard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-xs text-muted-foreground">Score global</p><p className="text-3xl font-bold text-foreground">{fmt(card.global)}</p><p className="text-sm text-primary">{card.nivelGlobal ?? "—"}</p></CardContent></Card>
            <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-xs text-muted-foreground">Mais forte</p><p className="font-semibold text-foreground">{card.maisForte?.nome ?? "—"}</p><p className="text-sm text-muted-foreground">{fmt(card.maisForte?.geral ?? null)}</p></CardContent></Card>
            <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-xs text-muted-foreground">Mais crítica</p><p className="font-semibold text-foreground">{card.maisCritica?.nome ?? "—"}</p><p className="text-sm text-muted-foreground">{fmt(card.maisCritica?.geral ?? null)}</p></CardContent></Card>
          </div>
          <ScoreTabela card={card} />
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">Radar RH x Gestores</CardTitle></CardHeader>
            <CardContent className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dim" />
                  <PolarRadiusAxis domain={[0, 5]} tickCount={6} />
                  <Radar name="RH" dataKey="RH" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                  <Radar name="Gestores" dataKey="Gestores" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.2} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorio" className="space-y-6">
          <div className="print:hidden"><Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir / salvar PDF</Button></div>
          <article className="space-y-6 rounded-2xl border bg-card p-6 print:border-0">
            <header className="border-b pb-4">
              <p className="text-xs text-muted-foreground">Diagnóstico de Maturidade do RH · CompSmart</p>
              <h2 className="text-2xl font-bold text-foreground">{empresaNome}</h2>
              <p className="text-sm text-muted-foreground">{d.nome_projeto} · {new Date(d.concluido_em ?? Date.now()).toLocaleDateString("pt-BR")}</p>
              <p className="mt-3 text-foreground">Score global <strong>{fmt(card.global)}</strong> · Nível <strong>{card.nivelGlobal ?? "—"}</strong></p>
              {card.nivelGlobal && <p className="text-sm text-muted-foreground">{fraseDoNivel(card.nivelGlobal)}</p>}
            </header>
            <p className="text-sm text-foreground rounded-xl bg-muted/50 p-3">
              Como ler o gap: ele compara a autoavaliação do RH com a percepção dos gestores (percepção cruzada). Gap positivo = gestores avaliam melhor que o RH; negativo = o RH se avalia melhor do que é percebido. Não é erro de cálculo.
            </p>
            <ScoreTabela card={card} />
            <section>
              <h3 className="font-semibold text-foreground">Destaques</h3>
              <p className="text-sm text-foreground mt-1">Mais forte: {card.maisForte?.nome ?? "—"} ({fmt(card.maisForte?.geral ?? null)}). Mais crítica: {card.maisCritica?.nome ?? "—"} ({fmt(card.maisCritica?.geral ?? null)}).</p>
            </section>
            <section>
              <h3 className="font-semibold text-foreground">Recomendações para as dimensões críticas</h3>
              <ul className="mt-2 space-y-2 text-sm text-foreground list-disc pl-5">
                {card.criticas.map((c) => <li key={c.n}><strong>{c.nome}:</strong> {RECOMENDACOES[c.n]}</li>)}
              </ul>
            </section>
            <p className="text-xs text-muted-foreground">Resultados agregados por grupo; nenhuma resposta individual é exibida. Baseado nos fundamentos de Dave Ulrich.</p>
          </article>
        </TabsContent>

        <TabsContent value="roadmap">
          <div className="grid gap-4 md:grid-cols-3">
            {card.criticas.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
            {card.criticas.map((c) => (
              <Card key={c.n} className="rounded-2xl">
                <CardHeader><CardTitle className="text-base">{c.nome}</CardTitle><p className="text-xs text-muted-foreground">Score {fmt(c.geral)}</p></CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm">
                    {ROADMAP_90[c.n].map((a, i) => <li key={i}><span className="font-semibold text-primary">Dias {i * 30 + 1}–{(i + 1) * 30}:</span> <span className="text-foreground">{a}</span></li>)}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScoreTabela({ card }: { card: ReturnType<typeof montarScorecard> }) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr><th className="p-2">Dimensão</th><th className="p-2">RH</th><th className="p-2">Gestores</th><th className="p-2">Gap</th><th className="p-2">Média</th><th className="p-2">Nível</th></tr>
        </thead>
        <tbody>
          {card.eixos.map((e) => (
            <Fragment key={`e${e.n}`}>
              <tr className="bg-muted/20"><td colSpan={4} className="p-2 font-semibold text-foreground">{e.nome}</td><td className="p-2 font-semibold">{fmt(e.media)}</td><td className="p-2">{e.nivel ?? "—"}</td></tr>
              {card.dims.filter((x) => x.eixo === e.n).map((x) => (
                <tr key={x.n} className="border-t">
                  <td className="p-2 text-foreground">D{x.n}. {DIMENSOES[x.n - 1].nome}</td>
                  <td className="p-2">{fmt(x.rh)}</td>
                  <td className="p-2">{fmt(x.gestores)}</td>
                  <td className="p-2">{x.gap == null ? "—" : (x.gap > 0 ? "+" : "") + fmt(x.gap)}</td>
                  <td className="p-2"><span className={`rounded-full px-2 py-0.5 ${COR[corDoScore(x.geral)]}`}>{fmt(x.geral)}</span></td>
                  <td className="p-2">{x.nivel ?? "—"}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
