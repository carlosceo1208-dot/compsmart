import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Briefcase, CheckCircle2, Loader2, Lock, MapPin, RotateCcw } from "lucide-react";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { supabase } from "@/integrations/supabase/client";
import { formatLocal } from "@/lib/brasil";
import { CONTRATACAO_LABEL, MODELO_LABEL, SENIORIDADE_LABEL } from "@/hooks/useVagas";
import {
  CONSENTIMENTO_TEXTO, CONSENTIMENTO_VERSAO, CURRICULO_MAX_BYTES, CURRICULO_MAX_MB, EMAIL_RE, mascaraTelefone, telefoneValido,
} from "@/config/recrutamento";
import { formatFaixa } from "./VagasPortal";

interface VagaDetalhe {
  slug: string; titulo: string; area: string | null; senioridade: string; modelo_trabalho: string; tipo_contratacao: string;
  cidade: string | null; uf: string | null; faixa_salarial_min: number | null; faixa_salarial_max: number | null;
  empresa: string; confidencial: boolean; responsabilidades: string | null; requisitos_obrigatorios: string | null;
  requisitos_desejaveis: string | null; competencias: string[] | null; qtd_vagas: number;
}

const toBase64 = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(",")[1] ?? "");
  r.onerror = () => rej(r.error);
  r.readAsDataURL(f);
});

const lbl = (m: Record<string, string>, k: string) => m[k] ?? k;

const VagaPublica = () => {
  const { slug = "" } = useParams();
  const { data: vaga, isLoading } = useQuery({
    queryKey: ["portal-vaga", slug],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("portal_vaga", { _slug: slug });
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as VagaDetalhe | null;
    },
  });

  const title = vaga ? `${vaga.titulo} — ${vaga.empresa} | Vagas CompSmart` : "Vaga | CompSmart";
  const description = vaga ? `Candidate-se à vaga de ${vaga.titulo} (${formatLocal(vaga.cidade, vaga.uf)}). Envio rápido, dados protegidos pela LGPD.` : "Vaga publicada na CompSmart.";

  return (
    <PublicLayout path={`/vagas/${slug}`} title={title} description={description}>
      <Helmet><meta name="robots" content="noindex, follow" /></Helmet>
      <section className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl space-y-6">
        <Link to="/vagas" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Todas as vagas</Link>
        {isLoading ? <Skeleton className="h-64 rounded-2xl" /> : !vaga ? (
          <Card className="rounded-2xl"><CardContent className="py-14 text-center space-y-3">
            <p className="text-lg font-semibold">Esta vaga não está mais aberta.</p>
            <Button asChild className="rounded-xl"><Link to="/vagas">Ver vagas abertas</Link></Button>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground inline-flex items-center gap-1">{vaga.confidencial && <Lock className="h-3.5 w-3.5" />}{vaga.empresa}</p>
                <h1 className="text-2xl sm:text-3xl font-bold">{vaga.titulo}</h1>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{formatLocal(vaga.cidade, vaga.uf)}</span>
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{lbl(MODELO_LABEL, vaga.modelo_trabalho)} · {lbl(CONTRATACAO_LABEL, vaga.tipo_contratacao)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">{lbl(SENIORIDADE_LABEL, vaga.senioridade)}</Badge>
                  {vaga.area && <Badge variant="outline" className="rounded-full">{vaga.area}</Badge>}
                  {formatFaixa(vaga.faixa_salarial_min, vaga.faixa_salarial_max) && <Badge variant="outline" className="rounded-full">{formatFaixa(vaga.faixa_salarial_min, vaga.faixa_salarial_max)}</Badge>}
                </div>
              </div>
              <Bloco titulo="Responsabilidades" texto={vaga.responsabilidades} />
              <Bloco titulo="Requisitos obrigatórios" texto={vaga.requisitos_obrigatorios} />
              <Bloco titulo="Requisitos desejáveis" texto={vaga.requisitos_desejaveis} />
              {!!vaga.competencias?.length && (
                <div className="space-y-2"><h2 className="font-semibold">Competências</h2>
                  <div className="flex flex-wrap gap-2">{vaga.competencias.map((c) => <Badge key={c} variant="outline" className="rounded-full">{c}</Badge>)}</div></div>
              )}
            </div>
            <div className="lg:col-span-2"><FormCandidatura vaga={vaga} /></div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

const Bloco = ({ titulo, texto }: { titulo: string; texto: string | null }) => texto?.trim() ? (
  <div className="space-y-1.5"><h2 className="font-semibold">{titulo}</h2><p className="text-sm whitespace-pre-line text-muted-foreground">{texto}</p></div>
) : null;

const vazio = { nome: "", email: "", telefone: "", cargo: "", senioridade: "" };

const FormCandidatura = ({ vaga }: { vaga: VagaDetalhe }) => {
  const [f, setF] = useState(vazio);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [aceite, setAceite] = useState(false);
  const [token, setToken] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [ok, setOk] = useState<{ jaInscrito: boolean } | null>(null);
  const set = (k: keyof typeof vazio, v: string) => setF((p) => ({ ...p, [k]: v }));

  const onArquivo = (file: File | null) => {
    const e = { ...erros }; delete e.curriculo;
    if (file && file.type !== "application/pdf") e.curriculo = "Envie um arquivo PDF.";
    else if (file && file.size > CURRICULO_MAX_BYTES) e.curriculo = `O currículo deve ter até ${CURRICULO_MAX_MB} MB.`;
    setErros(e); setArquivo(e.curriculo ? null : file);
  };

  const enviar = async () => {
    const e: Record<string, string> = {};
    if (f.nome.trim().length < 2) e.nome = "Informe seu nome.";
    if (!EMAIL_RE.test(f.email.trim())) e.email = "Informe um e-mail válido.";
    if (!telefoneValido(f.telefone)) e.telefone = "Informe telefone com DDD.";
    if (!aceite) e.aceite = "O aceite é obrigatório para enviar a candidatura.";
    if (erros.curriculo) e.curriculo = erros.curriculo;
    setErros(e); setFalha(null);
    if (Object.keys(e).length) return;
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke("portal-candidatura", {
        body: {
          slug: vaga.slug, nome: f.nome.trim(), email: f.email.trim().toLowerCase(), telefone: f.telefone,
          cargo_pretendido: f.cargo.trim(), ...(f.senioridade ? { senioridade: f.senioridade } : {}),
          consentimento: true, consentimento_versao: CONSENTIMENTO_VERSAO, turnstileToken: token,
          ...(arquivo ? { curriculo_base64: await toBase64(arquivo) } : {}),
        },
      });
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (error as any).context as Response | undefined;
        const body = ctx ? await ctx.json().catch(() => null) : null;
        if (body?.fields) setErros(Object.fromEntries(Object.entries(body.fields).map(([k, v]) => [k, (v as string[])[0]])));
        setFalha(ctx?.status === 429 ? "Muitas tentativas — tente novamente em instantes." : body?.error ?? "Não foi possível enviar agora. Tente novamente.");
        return;
      }
      setOk({ jaInscrito: !!data?.jaInscrito });
    } catch {
      setFalha("Não foi possível enviar agora. Verifique sua conexão e tente novamente.");
    } finally { setEnviando(false); }
  };

  if (ok) return (
    <Card className="rounded-2xl"><CardContent className="py-10 text-center space-y-3">
      <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
      <p className="text-lg font-semibold">{ok.jaInscrito ? "Você já estava inscrito nesta vaga." : "Candidatura enviada!"}</p>
      <p className="text-sm text-muted-foreground">{ok.jaInscrito ? "Seus dados foram atualizados." : "A empresa responsável vai analisar seu perfil e entrar em contato pelo e-mail informado."}</p>
      <Button asChild variant="outline" className="rounded-xl"><Link to="/vagas">Ver outras vagas</Link></Button>
    </CardContent></Card>
  );

  return (
    <Card className="rounded-2xl lg:sticky lg:top-24">
      <CardHeader><CardTitle className="text-lg">Candidatar-se</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {vaga.confidencial && <p className="text-xs rounded-xl bg-muted p-3 text-muted-foreground">Vaga confidencial — detalhes da empresa serão apresentados em etapa futura do processo.</p>}
        <Campo label="Nome completo *" erro={erros.nome}><Input value={f.nome} maxLength={150} disabled={enviando} onChange={(e) => set("nome", e.target.value)} autoComplete="name" /></Campo>
        <Campo label="E-mail *" erro={erros.email}><Input type="email" value={f.email} maxLength={255} disabled={enviando} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></Campo>
        <Campo label="Telefone *" erro={erros.telefone}><Input value={f.telefone} disabled={enviando} placeholder="(00) 00000-0000" inputMode="tel" onChange={(e) => set("telefone", mascaraTelefone(e.target.value))} /></Campo>
        <Campo label="Cargo pretendido"><Input value={f.cargo} maxLength={150} disabled={enviando} onChange={(e) => set("cargo", e.target.value)} /></Campo>
        <Campo label="Senioridade">
          <Select value={f.senioridade} onValueChange={(v) => set("senioridade", v)} disabled={enviando}>
            <SelectTrigger className="rounded-xl" aria-label="Senioridade"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{Object.entries(SENIORIDADE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </Campo>
        <Campo label={`Currículo (PDF até ${CURRICULO_MAX_MB} MB)`} erro={erros.curriculo}>
          <Input type="file" accept="application/pdf" disabled={enviando} onChange={(e) => onArquivo(e.target.files?.[0] ?? null)} />
        </Campo>
        <div className="space-y-1">
          <label className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground">
            <Checkbox checked={aceite} disabled={enviando} onCheckedChange={(v) => setAceite(v === true)} className="mt-0.5" />
            <span>{CONSENTIMENTO_TEXTO} <Link to="/politica-de-privacidade" className="underline" target="_blank">Política de privacidade</Link>.</span>
          </label>
          {erros.aceite && <p className="text-xs text-destructive">{erros.aceite}</p>}
        </div>
        <TurnstileWidget onVerify={setToken} onExpire={() => setToken("")} />
        {falha && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{falha}</span>
              <Button size="sm" variant="outline" onClick={enviar} disabled={enviando}><RotateCcw className="h-3.5 w-3.5 mr-1" />Reenviar</Button>
            </AlertDescription>
          </Alert>
        )}
        <Button className="w-full rounded-xl" onClick={enviar} disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enviar candidatura
        </Button>
      </CardContent>
    </Card>
  );
};

const Campo = ({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5"><Label>{label}</Label>{children}{erro && <p className="text-xs text-destructive">{erro}</p>}</div>
);

export default VagaPublica;
