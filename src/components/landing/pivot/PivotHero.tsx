import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { DiagnosticoCTA } from "./DiagnosticoCTA";
import simboloCrescimento from "@/assets/simbolo-crescimento.png.asset.json";

export const PivotHero = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-muted/40 py-14 md:py-24">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="flex flex-col items-center justify-center gap-5 md:flex-row md:gap-7">
          <img
            src={simboloCrescimento.url}
            alt="Símbolo de crescimento estratégico"
            className="size-28 shrink-0 rounded-2xl object-cover shadow-sm md:size-36"
          />
          <h1 className="max-w-xl text-center text-3xl font-bold leading-tight md:text-left md:text-5xl">
            <span className="text-primary">Descubra o nível de maturidade</span> da
            sua gestão de pessoas.
          </h1>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
          Responda a uma rápida avaliação prévia e veja onde sua gestão de
          pessoas está hoje. Na avaliação completa, a CompSmart mostra o
          caminho para transformar pessoas em vantagem competitiva — com
          dados, IA e consultoria sob demanda.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <DiagnosticoCTA id="cta-hero-diagnostico" />
          <Button asChild id="cta-hero-demo" size="lg" variant="outline">
            <a href="#demonstracao">
              <PlayCircle className="h-4 w-4 mr-2" />
              Ver demonstração
            </a>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
