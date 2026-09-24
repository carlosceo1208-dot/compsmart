import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DemoDialog } from "@/components/landing/public/DemoDialog";
import { ImageSlot } from "@/components/landing/public/ImageSlot";

export const PreFooterCTA = () => (
  <>
  <section className="pt-14 pb-10 bg-background">
    <div className="container mx-auto px-4 max-w-4xl">
      <ImageSlot label="Imagem E" alt="Equipe de RH trabalhando com tecnologia" />
    </div>
  </section>
  <section className="py-16 md:py-20 bg-primary">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto text-center space-y-5 text-primary-foreground">
        <h2 className="text-2xl md:text-4xl font-bold">
          Comece pelo que mais dói hoje
        </h2>
        <p className="text-primary-foreground/90">
          Agende uma demonstração com o nosso time ou comece pelo e-book de
          Remuneração Estratégica.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <DemoDialog size="lg" variant="secondary" />
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link to="/materiais">
              <Download className="h-4 w-4 mr-2" />
              Baixar o e-book
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
  </>
);
