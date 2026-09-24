import { Link } from "react-router-dom";
import { Linkedin, Mail, ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { ImageSlot } from "@/components/landing/public/ImageSlot";
import fotoJosue from "@/assets/socio-josue.png.asset.json";
import fotoCarlos from "@/assets/socio-carlos.png.asset.json";
import fotoFernando from "@/assets/socio-fernando.png.asset.json";
import imagemHistoria from "@/assets/historia-consultoria-executiva.png.asset.json";

interface Socio {
  nome: string;
  iniciais: string;
  cargo: string;
  bio: string;
  linkedin: string;
  foto?: string;
}

const SOCIOS: Socio[] = [
  {
    nome: "Carlos Eduardo",
    iniciais: "CE",
    cargo: "CEO & Fundador",
    bio: "Administrador de Empresas com MBA pela USP, expert e estrategista em gestão de pessoas, coach, mentor e orientador de carreira. Mais de 30 anos de experiência executiva em RH e Operações; pioneiro em benefícios flexíveis e práticas de remuneração — lidera a CompSmart como CEO & Fundador.",
    linkedin: "https://www.linkedin.com/in/ceocarloseduardooliveira/",
    foto: fotoCarlos.url,
  },
  {
    nome: "Fernando Curral",
    iniciais: "FC",
    cargo: "Sócio — Psicologia Organizacional & Bem-Estar",
    bio: "Psicólogo com mestrado em RH pela FMU e especializações em Psicologia da Saúde, Gestão do Stress e Burnout (UnG) e Ciências Endocrinológicas (UNIFESP). Há mais de 25 anos une a prática clínica à atuação organizacional, avaliando e planejando pessoas em empresas nacionais e multinacionais.",
    linkedin: "https://www.linkedin.com/in/fernando-curral-7a89045/",
    foto: fotoFernando.url,
  },
  {
    nome: "Josué Cruz",
    iniciais: "JC",
    cargo: "Sócio — Estratégia de Pessoas & Performance",
    foto: fotoJosue.url,
    bio: "Psicólogo, Executivo com sólida carreira em Telecomunicações, Indústria, Varejo/Franquias e Serviços Jurídicos. Transita com naturalidade entre a visão estratégica de conselho e a implementação tática, protegendo e impulsionando a performance sustentável por meio das pessoas — pela Vitalidade: o equilíbrio entre resultados robustos e a preservação da energia humana.",
    linkedin: "https://www.linkedin.com/in/josuecruz-rh/",
  },
];

const AboutUs = () => (
  <PublicLayout
    title="Quem Somos — CompSmart | Gestão Estratégica de Pessoas"
    description="Josué Cruz, Fernando Curral e Carlos Eduardo: décadas de experiência em RH unidas na CompSmart, parceira tecnológica de gestão estratégica de pessoas."
    path="/sobre-nos"
  >
    <section className="py-16 md:py-20 bg-gradient-to-br from-background via-primary/5 to-muted/40">
      <div className="container mx-auto px-4 max-w-3xl text-center space-y-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary">QUEM SOMOS</p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          Três amigos — J F C. Décadas de estrada. Um propósito em comum.
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Josué Cruz, Fernando Curral e Carlos Eduardo construíram a CompSmart para ser o
          parceiro tecnológico que sempre sentiram falta no RH.
        </p>
      </div>
    </section>

    <section className="py-14 bg-background">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center max-w-6xl">
        <div className="space-y-4 rounded-[20px] border border-primary/15 border-l-4 border-l-primary bg-card text-card-foreground p-6 md:p-8 shadow-[0_4px_20px_hsl(var(--foreground)/0.06)]">
          <div className="flex items-center gap-3">
            <Quote className="h-8 w-8 text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-2xl md:text-3xl font-extrabold">Nossa História</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Josué Cruz</strong>,{" "}
            <strong className="text-foreground">Fernando Curral</strong> e{" "}
            <strong className="text-foreground">Carlos Eduardo</strong> se conhecem de longa data. Cada um
            construiu uma carreira sólida no mundo corporativo — em empresas nacionais e
            multinacionais, de diferentes segmentos e portes — e também do outro lado da mesa,
            atuando como consultores. Fusões, reestruturações, gestão de pessoas, operações e
            diversos negócios: experiências complementares, acumuladas por décadas, que não se
            aprendem em sala de aula.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Foi desse reencontro que nasceu a CompSmart Tecnologia e Serviços de RH. Nós não
            queríamos criar mais um software burocrático que o RH "precisa usar". Queríamos
            construir o parceiro tecnológico que sempre sentimos falta: uma plataforma que
            automatiza o operacional, cruza dados e devolve inteligência — para que o RH saia da
            função de apagar incêndio e ocupe o papel de estrategista do negócio.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Por isso, a CompSmart nasce com um ecossistema completo de gestão estratégica de
            pessoas: remuneração e estrutura de cargos, inteligência de mercado, descrição e match
            de cargos, pesquisa salarial, controle orçamentário, avaliação de desempenho, clima
            organizacional, riscos psicossociais (NR-1), seleção e aquisição de talentos, trilhas
            de desenvolvimento e matriz de potencial — tudo conectado em uma única plataforma,
            apoiada por dashboards e agentes de IA dedicados a cada processo.
          </p>
        </div>
        <ImageSlot
          src={imagemHistoria.url}
          label="Imagem A"
          alt="Mesa de consultoria executiva com planilhas, documentos e indicadores"
          className="rounded-[20px] shadow-md"
        />
      </div>
    </section>

    <section className="py-14 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Os Sócios</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {SOCIOS.map((s) => (
            <Card key={s.nome} className="rounded-2xl border-primary/20">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3 h-full">
                <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full">
                  {s.foto ? (
                    <img src={s.foto} alt={`Foto de ${s.nome}`} loading="lazy" className="h-full w-full object-cover object-center" />
                  ) : (
                    <span className="text-2xl font-semibold text-muted-foreground">{s.iniciais}</span>
                  )}
                </div>
                <a
                  href={s.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold hover:text-primary hover:underline"
                >
                  {s.nome}
                </a>
                <p className="text-sm font-medium text-primary">{s.cargo}</p>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{s.bio}</p>
                <Button asChild variant="outline" size="sm">
                  <a href={s.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 mr-2" />
                    Conectar no LinkedIn
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <section className="py-14 bg-background">
      <div className="container mx-auto px-4 max-w-3xl text-center space-y-5">
        <p className="text-lg md:text-xl leading-relaxed">
          Unimos a solidez de quem viveu o RH na prática por décadas à agilidade de quem acredita
          em tecnologia. Nossa missão é simples e ousada: tornar a gestão de pessoas mais justa,
          competitiva e inteligente para empresas de todos os portes.
        </p>
        <p className="text-xl md:text-2xl font-semibold text-primary">
          Essa é a nossa história. E ela só faz sentido se continuar sendo escrita ao seu lado.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild size="lg">
            <Link to="/contato">
              Agende um diagnóstico gratuito
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="link">
            <a href="mailto:contato@compsmart.ia.br">
              <Mail className="h-4 w-4 mr-2" />
              Fale com a CompSmart
            </a>
          </Button>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default AboutUs;
