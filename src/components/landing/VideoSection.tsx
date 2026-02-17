import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

export const VideoSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Planilhas ou Inteligência?{" "}
          <span className="text-primary">
            Veja como a CompSmart elimina o trabalho exaustivo da revisão salarial.
          </span>
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          Assista ao diálogo entre um CEO e uma HR Manager e descubra por que empresas de alto crescimento estão abandonando os processos manuais.
        </p>

        <div className="relative rounded-xl overflow-hidden shadow-2xl border border-primary/10 aspect-video">
          <iframe
            src="https://www.youtube.com/embed/KWeXhzaJYU4"
            title="CompSmart - Ciclo Salarial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            loading="lazy"
          />
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Play className="h-4 w-4 text-primary" />
          <span>~5 minutos que podem transformar seu RH</span>
        </div>
      </div>
    </section>
  );
};
