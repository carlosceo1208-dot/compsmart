import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getSeoRoute } from "@/config/seoRoutes";
import { useNr1Questoes } from "@/hooks/useNr1";
import {
  RESPOSTA_OPCOES, RISCO_LABEL, RISCO_CLASS, DIMENSAO_LABEL, calcRisco, calcScoreNr1,
  type Dimensao, type NivelRisco,
} from "@/lib/nr1";

const PORTES = ["Pequena", "Média", "Grande"] as const;
const COLABS = ["até 99", "100–499", "500+"] as const;
const MODULOS = [
  "NR-1/Riscos Psicossociais",
  "Clima Organizacional",
  "Cargos e Salários",
  "Remuneração",
  "9-Box/Sucessão",
] as const;

const schema = z.object({
  nome: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  porte: z.enum(PORTES),
  colaboradores: z.enum(COLABS),
  modulo: z.enum(MODULOS),
  lgpd: z.literal(true),
});

const seo = getSeoRoute("/diagnostico");
type Step = "questionario" | "lead" | "resultado";

const Diagnostico = () => {
  const { data: questoes, isLoading } = useNr1Questoes(true);
  const [step, setStep] = useState<Step>("questionario");
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [f, setF] = useState({ nome: "", email: "", porte: "", colaboradores: "", modulo: "", lgpd: false });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ geral: number; nivel: NivelRisco; dimensoes: Record<string, number> } | null>(null);

  const total = questoes?.length ?? 0;
  const questao = questoes?.[idx];
  const valid = schema.safeParse(f).success;

  const responder = (v: number) => {
    if (!questao) return;
    setRespostas((r) => ({ ...r, [questao.id]: v }));
    if (idx + 1 < total) setIdx(idx + 1);
    else setStep("lead");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success || !questoes) return;
    const { geral, dimensoes } = calcScoreNr1(questoes, respostas);
    const nivel = calcRisco(geral) ?? "baixo";
    setSending(true);
    const { data: leadId, error } = await supabase.rpc("submit_diagnostico_lead" as never, {
      _nome: p.data.nome, _email: p.data.email, _porte: p.data.porte,
      _colaboradores: p.data.colaboradores, _modulo: p.data.modulo, _lgpd: true,
      _score: geral, _nivel: nivel, _respostas: respostas,
    } as never);
    if (error) {
      setSending(false);
      toast({ title: "Não foi possível enviar", description: "Tente novamente em instantes.", variant: "destructive" });
      return;
    }
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "diagnostico-resultado",
        recipientEmail: p.data.email.toLowerCase(),
        idempotencyKey: `diagnostico-${leadId}-${Date.now()}`,
        templateData: {
          nome: p.data.nome.split(" ")[0],
          score: geral,
          nivel: RISCO_LABEL[nivel],
          dimensoes: Object.entries(dimensoes).map(([d, s]) => ({ label: DIMENSAO_LABEL[d as Dimensao] ?? d, score: s })),
        },
      },
    }).catch(() => undefined);
    setSending(false);
    setResult({ geral, nivel, dimensoes });
    setStep("resultado");
  };

  return (
    <PublicLayout title={seo?.title ?? ""} description={seo?.description ?? ""} path="/diagnostico">
      <section className="py-14 md:py-20 bg-gradient-to-br from-background via-primary/5 to-muted/40">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="text-center space-y-3 mb-8">
            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1.5">
              Diagnóstico grátis em 2 min
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold">Diagnóstico NR-1 gratuito</h1>
            <p className="text-muted-foreground">
              Riscos psicossociais pelo método COPSOQ-III, com tratamento de dados conforme a LGPD.
            </p>
          </div>

          {step === "questionario" && (
            <Card className="rounded-2xl">
              {isLoading || !questao ? (
                <CardContent className="p-8 text-center text-muted-foreground">Carregando perguntas...</CardContent>
              ) : (
                <>
                  <CardHeader>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Pergunta {idx + 1} de {total}</span>
                      {idx > 0 && (
                        <button type="button" className="hover:underline" onClick={() => setIdx(idx - 1)}>Voltar</button>
                      )}
                    </div>
                    <Progress value={((idx + 1) / total) * 100} className="h-2 bg-primary/10" />
                    <CardTitle className="text-lg mt-4 leading-snug">{questao.enunciado}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup key={questao.id} value={respostas[questao.id]?.toString()} onValueChange={(v) => responder(Number(v))} className="space-y-2">
                      {RESPOSTA_OPCOES.map((o) => (
                        <Label key={o.value} htmlFor={`opt-${o.value}`} className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-accent transition-colors">
                          <RadioGroupItem value={o.value.toString()} id={`opt-${o.value}`} />
                          <span className="text-sm">{o.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </>
              )}
            </Card>
          )}

          {step === "lead" && (
            <Card className="rounded-2xl">
              <CardContent className="p-6 md:p-8">
                <p className="font-semibold mb-1">Quase lá!</p>
                <p className="text-sm text-muted-foreground mb-5">Informe seus dados para ver o resultado e recebê-lo por e-mail.</p>
                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome*</Label>
                    <Input id="nome" maxLength={100} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail corporativo*</Label>
                    <Input id="email" type="email" maxLength={255} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Porte da empresa*</Label>
                      <Select value={f.porte} onValueChange={(v) => setF({ ...f, porte: v })}>
                        <SelectTrigger aria-label="Porte da empresa"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{PORTES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Colaboradores*</Label>
                      <Select value={f.colaboradores} onValueChange={(v) => setF({ ...f, colaboradores: v })}>
                        <SelectTrigger aria-label="Quantidade de colaboradores"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{COLABS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Módulo de maior interesse*</Label>
                    <Select value={f.modulo} onValueChange={(v) => setF({ ...f, modulo: v })}>
                      <SelectTrigger aria-label="Módulo de maior interesse"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{MODULOS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
                    <Checkbox checked={f.lgpd} onCheckedChange={(c) => setF({ ...f, lgpd: c === true })} className="mt-0.5" aria-label="Consentimento LGPD" />
                    <span>Concordo em receber conteúdos e contato comercial da CompSmart, conforme a LGPD.</span>
                  </label>
                  <Button type="submit" size="lg" className="w-full" disabled={!valid || sending}>
                    {sending ? "Enviando..." : "Receber meu diagnóstico"}
                  </Button>
                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" /> Seus dados são tratados conforme a LGPD.
                  </p>
                </form>
              </CardContent>
            </Card>
          )}

          {step === "resultado" && result && (
            <Card className="rounded-2xl">
              <CardContent className="p-6 md:p-8 space-y-5 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <p className="text-lg font-semibold">
                  Recebemos seu pedido! Em instantes você recebe seu diagnóstico por e-mail.
                </p>
                <div>
                  <p className="text-sm text-muted-foreground">Indicador inicial de risco psicossocial</p>
                  <p className="text-5xl font-bold">{result.geral.toFixed(1)}<span className="text-lg text-muted-foreground">/100</span></p>
                  <Badge className={`${RISCO_CLASS[result.nivel]} mt-2 text-base`}>Risco {RISCO_LABEL[result.nivel]}</Badge>
                </div>
                <div className="text-left space-y-1.5">
                  {Object.entries(result.dimensoes).map(([d, s]) => (
                    <div key={d} className="flex justify-between text-sm border-b border-border/60 py-1">
                      <span>{DIMENSAO_LABEL[d as Dimensao] ?? d}</span>
                      <span className="font-semibold">{s.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-left text-xs text-muted-foreground bg-muted rounded-lg p-3">
                  Este é um indicador inicial, respondido por uma pessoa em nome da empresa. O diagnóstico completo
                  (40 perguntas, respondido pelos colaboradores de forma anônima) é o que sustenta o atendimento à NR-1.
                </p>
                <Button asChild variant="outline">
                  <Link to="/contato">Agendar demonstração <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </PublicLayout>
  );
};

export default Diagnostico;
