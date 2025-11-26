import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Floating Orbs */}
      <div className="hero-orb w-[500px] h-[500px] bg-primary/30 top-20 -left-40 animate-float" style={{ animationDelay: "0s" }} />
      <div className="hero-orb w-[400px] h-[400px] bg-secondary/30 bottom-20 -right-40 animate-float" style={{ animationDelay: "1s" }} />
      <div className="hero-orb w-[300px] h-[300px] bg-accent/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" style={{ animationDelay: "2s" }} />
      
      {/* Decorative Sparkles */}
      <div className="absolute top-32 left-[15%] w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
      <div className="absolute top-40 right-[20%] w-3 h-3 bg-secondary rounded-full animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
      <div className="absolute bottom-40 left-[25%] w-2 h-2 bg-accent rounded-full animate-pulse-glow" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge - Animated Entry */}
          <div className="flex items-center justify-center gap-3 flex-wrap animate-fade-in-down">
            <Badge className="bg-gradient-primary text-white px-4 py-1.5 text-sm flex items-center gap-2 shadow-primary">
              <Sparkles className="h-4 w-4" />
              Lançamento Janeiro 2026
            </Badge>
          </div>

          {/* Headline - Animated Entry with Gradient Shift */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Gestão de Remuneração{" "}
            <span 
              className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient-shift"
              style={{ 
                backgroundSize: "200% auto",
                willChange: "background-position"
              }}
            >
              Estratégica com IA
            </span>
          </h1>

          {/* Subtitle - Animated Entry */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Monte estruturas salariais, benefícios, PLR e fique em compliance — tudo em um só lugar.
            Uma plataforma completa que atende empresas de todos os portes — de startups a grandes corporações.
          </p>

          {/* CTAs - Animated Entry with Enhanced Hover Effects */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button 
              size="lg"
              className="bg-gradient-primary hover:opacity-90 hover:shadow-primary hover:scale-105 text-lg px-8 shadow-lg w-full sm:w-auto transition-all duration-300 will-change-transform"
              onClick={() => navigate("/auth")}
            >
              Começar Grátis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="glass-effect hover:bg-primary/10 hover:scale-105 text-lg px-8 w-full sm:w-auto transition-all duration-300 will-change-transform"
              onClick={() => navigate("/auth")}
            >
              Ver Demonstração
            </Button>
          </div>

          {/* Trust Badge - Animated Entry */}
          <p className="text-sm text-muted-foreground pt-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            ✓ Sem cartão de crédito • ✓ Setup em 5 minutos • ✓ LGPD Compliant
          </p>
        </div>
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
