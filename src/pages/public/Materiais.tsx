import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { MaterialsSection } from "@/components/landing/pivot/MaterialsSection";

const Materiais = () => (
  <PublicLayout
    title="Materiais e e-books | CompSmart"
    description="Materiais gratuitos sobre remuneração estratégica, NR-1 e riscos psicossociais, clima e 9-Box para times de RH e lideranças."
    path="/materiais"
  >
    <section className="py-16 md:py-20 bg-gradient-to-br from-background via-primary/5 to-muted/40">
      <div className="container mx-auto px-4 text-center max-w-2xl space-y-4">
        <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1.5">
          <BookOpen className="h-3.5 w-3.5 mr-2" />
          Materiais
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold">
          Conteúdo para decidir melhor
        </h1>
        <p className="text-muted-foreground md:text-lg">
          Materiais práticos, escritos por quem vive gestão de pessoas todos os
          dias.
        </p>
      </div>
    </section>
    <MaterialsSection variant="full" />
  </PublicLayout>
);

export default Materiais;
