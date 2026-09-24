import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DemoDialog } from "@/components/landing/public/DemoDialog";
import imagemEquipe from "@/assets/imagem-e-equipe.png.asset.json";

export const PreFooterCTA = () => (
  <section className="bg-background px-4 py-14">
    <div className="relative mx-auto aspect-video max-h-[520px] max-w-6xl overflow-hidden rounded-2xl shadow-md">
      <img
        src={imagemEquipe.url}
        alt="Equipe de RH trabalhando com tecnologia"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-foreground/65" aria-hidden="true" />
      <div className="relative z-10 flex h-full items-center px-6 py-12 sm:px-10 md:px-14">
        <div className="max-w-3xl space-y-5 text-background">
        <h2 className="text-2xl md:text-4xl font-bold">
          Comece pelo que mais dói hoje
        </h2>
        <p className="text-background/90">
          Agende uma demonstração com o nosso time ou comece pelo e-book de
          Remuneração Estratégica.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <DemoDialog size="lg" variant="secondary" />
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-background/60 bg-transparent text-background hover:bg-background/10 hover:text-background"
          >
            <Link to="/materiais">
              <Download className="h-4 w-4 mr-2" />
              Baixar o e-book
            </Link>
          </Button>
        </div>
      </div>
    </div>
    </div>
  </section>
);
