import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { UrgencyBanner } from "./UrgencyBanner";
import { DiagnosticoCTA } from "./DiagnosticoCTA";
import simboloCrescimento from "@/assets/simbolo-crescimento.png.asset.json";

export const PivotHero = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-muted/40 py-14 md:py-24">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <UrgencyBanner />

        <div className="flex flex-col items-center justify-center gap-5 md:flex-row md:gap-7">
          <img
            src={simboloCrescimento.url}
            alt="Símbolo de crescimento estratégico"
            className="size-28 shrink-0 rounded-2xl object-cover shadow-sm md:size-36"
          />
          <h1 className="max-w-xl text-center text-3xl font-bold leading-tight md:text-left md:text-5xl">
            O RH virou obrigação legal e alavanca estratégica.{" "}
            <span className="text-primary">A CompSmart faz os dois.</span>
          </h1>
        </div>

        <p className="text-base md:text-lg text-muted-foreground">
          Plataforma com 8 agentes de IA que cruza NR-1, clima, desempenho,
          remuneração e sucessão — e consultoria sob demanda para levar da
          estrutura ao resultado.
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
