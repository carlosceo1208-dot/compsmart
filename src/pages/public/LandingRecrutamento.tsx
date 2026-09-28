import { Link } from "react-router-dom";
import {
  ArrowRight, BadgeDollarSign, BarChart3, Clock, EyeOff, Filter, Lock, MapPin, Search, ShieldCheck, Sparkles, Target, Users,
} from "lucide-react";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { DemoDialog } from "@/components/landing/public/DemoDialog";
import { Button } from "@/components/ui/button";

const MODULO = "Recrutamento & Seleção";

const ANCORAS = [
  { id: "abertura", label: "Abertura" },
  { id: "problema", label: "Problema" },
  { id: "solucao", label: "Solução" },
  { id: "metricas", label: "Métricas" },
];

const BULLETS = [
  { icon: BadgeDollarSign, text: "Faixa salarial sugerida com origem declarada (pesquisa ou tabela da empresa)" },
  { icon: EyeOff, text: "Vagas confidenciais para busca executiva, sem expor o nome da empresa" },
  { icon: Sparkles, text: "Perfil da vaga gerado por IA a partir do cargo e da CBO" },
  { icon: ShieldCheck, text: "Candidaturas com aceite LGPD registrado e currículos protegidos" },
];

const SOLUCOES = [
  { icon: Target, title: "A vaga que nasce certa", text: "Cargo, família, nível e faixa salarial saem da sua estrutura de remuneração. A vaga já abre alinhada ao que a empresa pode e quer pagar." },
  { icon: Lock, title: "Sigilo em busca executiva", text: "Vagas confidenciais ficam fora da listagem pública e só abrem por link. O nome, o logo e a descrição da empresa não chegam ao candidato." },
  { icon: Filter, title: "IA e funil sob controle", text: "O agente Talent sugere o perfil da vaga e apoia a triagem. Cada candidato segue por etapas claras até a decisão do RH." },
];

const METRICAS = [
  { icon: Clock, title: "Tempo de vaga aberta", text: "Quantos dias cada vaga leva da abertura até o fechamento." },
  { icon: Users, title: "Candidaturas por vaga", text: "Volume recebido pelo portal e por importação em lote." },
  { icon: BarChart3, title: "Conversão por etapa", text: "Onde os candidatos avançam ou param no funil." },
  { icon: BadgeDollarSign, title: "Vagas com faixa definida", text: "Quais vagas já abriram com faixa salarial de origem declarada." },
];

const irPara = (id: string) => {
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
};

const secao = "scroll-mt-40 lg:scroll-mt-48 xl:scroll-mt-40";

const FUNIL_ETAPAS = [
  { label: "Triagem", cor: "var(--funil-1)" },
  { label: "Entrevista RH", cor: "var(--funil-2)" },
  { label: "Entrevista Gestor", cor: "var(--funil-3)" },
  { label: "Proposta", cor: "var(--funil-4)" },
  { label: "Contratado", cor: "var(--funil-5)" },
];

const FunilContratacao = () => (
  <div className="mx-auto mt-8 max-w-[640px]">
    <ol aria-label="Etapas do funil de contratação" className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
      {FUNIL_ETAPAS.map(({ label, cor }, indice) => (
        <li key={label} className="flex flex-1 flex-col items-center gap-1.5 sm:flex-row sm:gap-1.5">
          <span
            className="w-full rounded-xl px-2 py-2.5 text-center text-xs font-semibold text-primary-foreground sm:flex-1 sm:text-sm"
            style={{ backgroundColor: cor }}
          >
            {label}
          </span>
          {indice < FUNIL_ETAPAS.length - 1 && (
            <ArrowRight className="h-4 w-4 shrink-0 rotate-90 text-muted-foreground sm:rotate-0" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  </div>
);

type VagaExemplo = {
  titulo: string; local: string; senioridade: string;
  faixa?: string; badgeVerde?: string; badgeNeutro?: string;
};

const VAGAS_EXEMPLO: VagaExemplo[] = [
  { titulo: "Analista de Remuneração", local: "São Paulo – SP", senioridade: "Pleno", faixa: "R$ 12.000 – 15.000", badgeVerde: "Faixa salarial fornecida" },
  { titulo: "Coordenador de RH", local: "São Paulo – SP", senioridade: "Sênior", badgeNeutro: "Confidencial" },
  { titulo: "Analista de Recrutamento", local: "Remoto", senioridade: "Júnior" },
];

const ListagemVagasExemplo = () => (
  <div className="mx-auto mt-8 max-w-[640px]">
    <p className="text-center text-xs text-muted-foreground">Exemplo ilustrativo de tela</p>
    <div role="img" aria-label="Exemplo ilustrativo do portal de vagas" className="mt-2 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2 rounded-full border border-input bg-background px-3.5 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Buscar vagas...</span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {["São Paulo – SP", "Remoto", "Híbrido"].map((chip) => (
          <span key={chip} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {chip}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Tempo médio de fechamento: 21 dias</span>
        <span className="rounded-full bg-success px-2.5 py-0.5 text-xs font-bold text-success-foreground">− 40%</span>
      </div>
      <div className="mt-3 grid gap-2">
        {VAGAS_EXEMPLO.map(({ titulo, local, senioridade, faixa, badgeVerde, badgeNeutro }) => (
          <div key={titulo} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-border bg-background p-3">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{titulo}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {local}
              </p>
              {(faixa || badgeVerde || badgeNeutro) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {faixa && (
                    <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground">{faixa}</span>
                  )}
                  {badgeVerde && (
                    <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">{badgeVerde}</span>
                  )}
                  {badgeNeutro && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{badgeNeutro}</span>
                  )}
                </div>
              )}
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{senioridade}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const LandingRecrutamento = () => (
  <PublicLayout
    path="/modulos/selecao-rs"
    title="Recrutamento & Seleção com Faixa Salarial Certa | CompSmart"
    description="Vagas que já nascem com faixa salarial de origem declarada, busca confidencial, perfil gerado por IA e candidaturas em conformidade com a LGPD."
  >
    <div className="bg-muted/30">
      <nav aria-label="Navegação da página" className="border-b border-border bg-background/90">
        <ul className="container mx-auto px-4 flex gap-2 overflow-x-auto py-2">
          {ANCORAS.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => irPara(a.id)}
                className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section id="abertura" className={`${secao} container mx-auto px-4 py-14 md:py-20`}>
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Aquisição de Talentos
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight text-foreground">
            Sua próxima contratação já nasce com a faixa salarial certa.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Um R&S que conversa com a sua estratégia de remuneração: cada vaga sai da estrutura de cargos e
            salários da empresa, com sigilo quando precisa e apoio de IA do perfil à triagem.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {BULLETS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <Icon className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                <span className="text-sm text-foreground">{text}</span>
              </li>
            ))}
          </ul>
          <DemoDialog triggerLabel="Agende uma demonstração" size="lg" moduloInteresse={MODULO} className="mt-8" />
        </div>
      </section>

      <section id="problema" className={`${secao} bg-background py-14 md:py-20`}>
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold">Quanto custa uma vaga parada?</h2>
          <p className="mt-4 text-muted-foreground">
            Enquanto a vaga não fecha, o trabalho fica acumulado no time, as entregas atrasam e a liderança
            gasta tempo em entrevistas que não avançam. Quando a faixa salarial não foi definida antes, a
            negociação trava no final — e o processo recomeça.
          </p>
          <p className="mt-3 text-muted-foreground">
            Em buscas executivas, expor o nome da empresa cedo demais pode gerar ruído interno e no mercado.
          </p>
        </div>
      </section>

      <section id="solucao" className={`${secao} container mx-auto px-4 py-14 md:py-20`}>
        <h2 className="text-2xl md:text-3xl font-bold text-center">Como a CompSmart resolve</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {SOLUCOES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
        <ListagemVagasExemplo />
      </section>

      <section id="metricas" className={`${secao} bg-background py-14 md:py-20`}>
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center">O que você passa a acompanhar</h2>
          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
            Indicadores calculados com os dados das suas próprias vagas — sem números de vitrine.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METRICAS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <Icon className="h-6 w-6 text-success" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <FunilContratacao />
        </div>
      </section>

      <section className="bg-navy text-navy-foreground py-14 md:py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold">Contrate com a faixa certa desde o primeiro dia</h2>
          <p className="mt-3 opacity-90">Veja o módulo funcionando com os dados da sua empresa.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <DemoDialog triggerLabel="Agende uma demonstração" size="lg" moduloInteresse={MODULO} variant="secondary" />
            <Button asChild size="lg" variant="outline" className="border-navy-foreground bg-none bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground">
              <Link to="/vagas">Ver o portal de vagas</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  </PublicLayout>
);

export default LandingRecrutamento;
