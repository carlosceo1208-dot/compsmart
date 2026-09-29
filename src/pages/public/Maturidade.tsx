import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { ArrowRight, BarChart3, Cpu, HeartHandshake, Rocket, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getSeoRoute } from "@/config/seoRoutes";
import { EIXOS, NIVEIS, TEASER, LIKERT, LGPD_VERSAO, media, nivelDoScore, fraseDoNivel, type NivelKey } from "@/lib/maturidade";

const seo = getSeoRoute("/maturidade");
const ICONES = [BarChart3, Cpu, HeartHandshake, Rocket];
const PORTES = [{ v: "pequena", l: "Pequena" }, { v: "media", l: "Média" }, { v: "grande", l: "Grande" }];

const schema = z.object({
  nome: z.string().trim().min(2).max(120),
  empresa: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  porte: z.enum(["pequena", "media", "grande"]),
  lgpd: z.literal(true),
});

const Maturidade = () => {
  const [idx, setIdx] = useState(0);
  const [resp, setResp] = useState<number[]>([]);
  const [resultado, setResultado] = useState<{ score: number; nivel: NivelKey } | null>(null);
  const [f, setF] = useState({ nome: "", empresa: "", email: "", porte: "", lgpd: false });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const responder = (v: number) => {
    const novo = [...resp.slice(0, idx), v];
    setResp(novo);
    if (idx + 1 < TEASER.length) setIdx(idx + 1);
    else {
      const score = media(novo)!;
      setResultado({ score, nivel: nivelDoScore(score) });
    }
  };

  const valido = schema.safeParse(f).success;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success || !resultado) return;
    setEnviando(true);
    const { error } = await supabase.rpc("submit_maturidade_lead", {
      p_nome: p.data.nome, p_empresa: p.data.empresa, p_email: p.data.email, p_porte: p.data.porte,
      p_nivel: resultado.nivel, p_score: Number(resultado.score.toFixed(2)), p_consentimento: true, p_versao: LGPD_VERSAO,
    });
    setEnviando(false);
    if (error) {
      toast({
        title: error.message.includes("muitas_tentativas") ? "Muitos envios em pouco tempo" : "Não foi possível enviar",
        description: error.message.includes("muitas_tentativas") ? "Tente novamente em uma hora." : "Confira os dados e tente de novo.",
        variant: "destructive",
      });
      return;
    }
    setEnviado(true);
  };

  const irParaTeste = () => document.getElementById("teste")?.scrollIntoView({ behavior: "smooth" });

  return (
    <PublicLayout title={seo?.title ?? ""} description={seo?.description ?? ""} path="/maturidade">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
          <Badge variant="secondary" className="rounded-full mb-5">Diagnóstico de Maturidade do RH</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
            Seu RH opera em qual nível de maturidade?
          </h1>
          <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Descubra o quanto o seu RH está conectado ao plano estratégico do negócio — e o que falta para ele entregar mais resultado.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={irParaTeste}>Descobrir meu nível grátis <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button size="lg" variant="outline" asChild><Link to="/contato">Falar com um consultor</Link></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">10 perguntas · cerca de 2 minutos · resultado na hora</p>
        </div>
      </section>

      {/* 4 papéis */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <h2 className="text-3xl font-bold text-foreground">Os 4 papéis do RH moderno</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">O diagnóstico avalia 12 dimensões, três em cada papel.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EIXOS.map((e, i) => {
            const Icon = ICONES[i];
            return (
              <Card key={e.n} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-4 font-semibold text-foreground">{e.nome}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{e.valor}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 5 níveis */}
      <section className="bg-muted/40 border-y">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground">Os 5 níveis de maturidade</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-5 md:items-end">
            {NIVEIS.map((n) => (
              <div key={n.key} className="rounded-2xl border bg-card p-5" style={{ minHeight: `${6 + n.n * 1.5}rem` }}>
                <span className="text-xs font-semibold text-primary">Nível {n.n}</span>
                <h3 className="mt-1 font-semibold text-foreground">{n.key}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{n.frase}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-3xl font-bold text-foreground">Como funciona</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {["Responda 10 perguntas rápidas sobre o seu RH.", "Veja na hora o seu nível provisório de maturidade.", "Converse com um consultor para o diagnóstico completo, com RH e gestores."].map((t, i) => (
            <li key={i} className="rounded-2xl border bg-card p-6">
              <span className="text-3xl font-bold text-primary">{i + 1}</span>
              <p className="mt-2 text-foreground">{t}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Teaser */}
      <section id="teste" className="container mx-auto px-4 pb-20 max-w-2xl scroll-mt-28">
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6 md:p-8">
            {!resultado && (
              <>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Pergunta {idx + 1} de {TEASER.length}</span>
                  <span>Sem login · respostas não são gravadas</span>
                </div>
                <Progress value={((idx) / TEASER.length) * 100} className="h-2" />
                <p className="mt-6 text-lg font-medium text-foreground leading-snug">{TEASER[idx].afirmacao}</p>
                <div className="mt-6 grid gap-2">
                  {LIKERT.map((o) => (
                    <Button key={o.v} variant={resp[idx] === o.v ? "default" : "outline"} className="justify-start h-auto py-3" onClick={() => responder(o.v)}>
                      <span className="w-6 font-semibold">{o.v}</span> {o.label}
                    </Button>
                  ))}
                </div>
                {idx > 0 && <Button variant="ghost" size="sm" className="mt-4" onClick={() => setIdx(idx - 1)}>← Anterior</Button>}
              </>
            )}

            {resultado && (
              <div>
                <p className="text-sm text-muted-foreground">Seu nível provisório</p>
                <h2 className="text-3xl font-bold text-primary mt-1">{resultado.nivel}</h2>
                <p className="mt-2 text-foreground">{fraseDoNivel(resultado.nivel)}</p>
                <p className="mt-2 text-xs text-muted-foreground">Média {resultado.score.toFixed(1).replace(".", ",")} de 5 em 10 perguntas. O diagnóstico completo avalia 48 afirmações com RH e gestores.</p>

                {enviado ? (
                  <div className="mt-6 rounded-xl border bg-muted/40 p-5 flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Recebemos seu pedido!</p>
                      <p className="text-sm text-muted-foreground">Um consultor da CompSmart vai entrar em contato para o diagnóstico completo.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={enviar} className="mt-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5"><Label htmlFor="m-nome">Nome</Label><Input id="m-nome" maxLength={120} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
                      <div className="space-y-1.5"><Label htmlFor="m-emp">Empresa</Label><Input id="m-emp" maxLength={160} value={f.empresa} onChange={(e) => setF({ ...f, empresa: e.target.value })} /></div>
                      <div className="space-y-1.5"><Label htmlFor="m-email">E-mail corporativo</Label><Input id="m-email" type="email" maxLength={255} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
                      <div className="space-y-1.5">
                        <Label>Porte</Label>
                        <Select value={f.porte} onValueChange={(v) => setF({ ...f, porte: v })}>
                          <SelectTrigger aria-label="Porte"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{PORTES.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <label className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Checkbox checked={f.lgpd} onCheckedChange={(c) => setF({ ...f, lgpd: c === true })} className="mt-0.5" aria-label="Aceite LGPD" />
                      <span>Autorizo a CompSmart a usar meus dados para contato sobre o diagnóstico, conforme a LGPD e a <Link to="/politica-de-privacidade" className="underline">Política de Privacidade</Link>.</span>
                    </label>
                    <Button type="submit" size="lg" className="w-full" disabled={!valido || enviando}>
                      {enviando ? "Enviando…" : "Quero o diagnóstico completo"}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Dados tratados conforme a LGPD · Baseado nos fundamentos de Dave Ulrich
        </p>
      </section>
    </PublicLayout>
  );
};

export default Maturidade;
