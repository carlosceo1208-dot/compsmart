import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { DiagnosticoCTA } from "./DiagnosticoCTA";
import simboloCrescimento from "@/assets/simbolo-crescimento.png.asset.json";
import { ESTILOS_GESTAO, NIVEIS_ESTRUTURAIS } from "@/lib/maturidade";

export const PivotHero = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-muted/40 py-10 md:py-16">
    <div className="container mx-auto px-4">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(32rem,1.08fr)] lg:gap-10">
        <div className="text-center lg:text-left">
          <Badge variant="secondary" className="mb-5 rounded-full">
            Maturidade da Gestão de Pessoas
          </Badge>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
          <img
            src={simboloCrescimento.url}
            alt="Símbolo de crescimento estratégico"
              className="size-20 shrink-0 rounded-2xl object-cover shadow-sm md:size-24"
          />
            <h1 className="max-w-xl text-center text-3xl font-bold leading-tight sm:text-left md:text-5xl">
            <span className="text-primary">Descubra o nível de maturidade</span> da
            sua gestão de pessoas.
          </h1>
        </div>

          <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
          Responda a uma rápida avaliação prévia e veja onde sua gestão de
          pessoas está hoje. Na avaliação completa, a CompSmart mostra o
          caminho para transformar pessoas em vantagem competitiva — com
          dados, IA e consultoria sob demanda.
        </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
          <DiagnosticoCTA id="cta-hero-diagnostico" />
          <Button asChild id="cta-hero-demo" size="lg" variant="outline">
            <a href="#demonstracao">
              <PlayCircle className="h-4 w-4 mr-2" />
              Ver demonstração
            </a>
          </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h2 className="min-h-10 text-xs font-semibold uppercase text-primary sm:text-sm">
                Maturidade estrutural
              </h2>
              <ol className="mt-3 space-y-2.5">
                {NIVEIS_ESTRUTURAIS.map((nivel) => (
                  <li key={nivel.n} className="flex items-center gap-2 text-sm sm:text-base">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {nivel.n}
                    </span>
                    <span className="font-medium text-foreground">{nivel.nome}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-l pl-4 sm:pl-6">
              <h2 className="min-h-10 text-xs font-semibold uppercase text-primary sm:text-sm">
                Estilo de gestão
              </h2>
              <ol className="mt-3 space-y-2.5">
                {ESTILOS_GESTAO.map((estilo) => (
                  <li key={estilo.n} className="flex items-center gap-2 text-sm sm:text-base">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {estilo.n}
                    </span>
                    <span className="font-medium text-foreground">{estilo.nome}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-5 border-t pt-4">
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              O diagnóstico gratuito apresenta o nível de maturidade estrutural.
              O estilo de gestão integra o modelo completo conduzido com nossos
              consultores.
            </p>
            <Button asChild variant="link" className="mt-2 h-auto p-0">
              <Link to="/maturidade">
                Descobrir meu nível
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);
