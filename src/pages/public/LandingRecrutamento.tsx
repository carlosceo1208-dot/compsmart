import { Link } from "react-router-dom";
import {
  BadgeDollarSign, BarChart3, Clock, EyeOff, Filter, Lock, ShieldCheck, Sparkles, Target, Users,
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
        </div>
      </section>

      <section className="bg-navy text-navy-foreground py-14 md:py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold">Contrate com a faixa certa desde o primeiro dia</h2>
          <p className="mt-3 opacity-90">Veja o módulo funcionando com os dados da sua empresa.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <DemoDialog triggerLabel="Agende uma demonstração" size="lg" moduloInteresse={MODULO} variant="secondary" />
            <Button asChild size="lg" variant="outline" className="border-navy-foreground bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground">
              <Link to="/vagas">Ver o portal de vagas</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  </PublicLayout>
);

export default LandingRecrutamento;
