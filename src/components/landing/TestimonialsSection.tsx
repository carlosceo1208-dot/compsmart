import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Building2, Rocket, Target } from "lucide-react";

export const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-primary text-white px-4 py-1.5 mb-6">
              <Rocket className="h-4 w-4 mr-2" />
              Lançamento Janeiro 2026
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Preparado para{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                empresas pioneiras
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Seja uma das primeiras empresas a transformar sua gestão de remuneração com IA
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl w-fit mx-auto mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                10.000+
              </div>
              <p className="text-muted-foreground">
                Empresas projetadas para os primeiros 12 meses
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl w-fit mx-auto mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                PMEs
              </div>
              <p className="text-muted-foreground">
                Foco em pequenas e médias empresas até 1000 funcionários
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl w-fit mx-auto mb-4">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Brasil + LATAM
              </div>
              <p className="text-muted-foreground">
                Expansão planejada para toda América Latina
              </p>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              🏆 Desenvolvido por especialistas em RH e Remuneração • 🔬 Metodologia baseada em Hay e Mercer
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
