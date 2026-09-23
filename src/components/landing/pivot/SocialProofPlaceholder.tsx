import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { DemoDialog } from "@/components/landing/public/DemoDialog";

export const SocialProofPlaceholder = () => (
  <section className="py-16 md:py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <Card className="max-w-3xl mx-auto rounded-2xl border-dashed">
        <CardContent className="p-8 md:p-10 text-center space-y-4">
          <Badge
            variant="outline"
            className="rounded-full text-xs px-3 py-1 mx-auto"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Resultados em breve
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold">
            Casos e resultados de clientes
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Estamos acompanhando as primeiras implantações e vamos publicar aqui
            os resultados reais, com a autorização de cada empresa. Enquanto
            isso, o melhor jeito de avaliar a plataforma é ver funcionando com os
            seus dados.
          </p>
          <div className="flex justify-center pt-2">
            <DemoDialog size="lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
);
