import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 bg-gradient-to-br from-background via-primary/5 to-secondary/10 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge className="bg-gradient-primary text-white px-4 py-1.5 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Lançamento Janeiro 2026
            </Badge>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span className="ml-1">Desenvolvido para PMEs</span>
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Gestão de Remuneração{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Estratégica com IA
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Monte estruturas salariais, benefícios, PLR e fique em compliance — tudo em um só lugar.
            Desenvolvido para pequenas e médias empresas brasileiras.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button 
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 shadow-lg w-full sm:w-auto"
              onClick={() => navigate("/auth")}
            >
              Começar Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-lg px-8 w-full sm:w-auto"
              onClick={() => navigate("/auth")}
            >
              Ver Demonstração
            </Button>
          </div>

          {/* Trust Badge */}
          <p className="text-sm text-muted-foreground pt-4">
            ✓ Sem cartão de crédito • ✓ Setup em 5 minutos • ✓ LGPD Compliant
          </p>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
