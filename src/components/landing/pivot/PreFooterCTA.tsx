import { DiagnosticoCTA } from "./DiagnosticoCTA";
import { DemoDialog } from "@/components/landing/public/DemoDialog";
import imagemEquipe from "@/assets/imagem-e-equipe.png.asset.json";

export const PreFooterCTA = () => (
  <section className="bg-background px-4 py-14">
    <div className="relative mx-auto min-h-[430px] max-w-6xl overflow-hidden rounded-2xl shadow-md sm:min-h-[380px] md:aspect-video md:min-h-0 md:max-h-[520px]">
      <img
        src={imagemEquipe.url}
        alt="Equipe de RH trabalhando com tecnologia"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-foreground/65" aria-hidden="true" />
      <div className="relative z-10 flex h-full items-center px-6 py-12 sm:px-10 md:px-14">
        <div className="max-w-3xl space-y-5 text-background">
        <h2 className="text-2xl md:text-4xl font-bold">
          Sua empresa está pronta para decidir RH com dados?
        </h2>
        <p className="text-background/90">
          Comece pelo diagnóstico gratuito ou fale com um especialista do nosso time.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <DiagnosticoCTA id="cta-footer-diagnostico" variant="secondary" />
          <DemoDialog size="lg" variant="outline" triggerLabel="Fale com um especialista" />
        </div>
      </div>
    </div>
    </div>
  </section>
);
