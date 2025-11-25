import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary-hover to-secondary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Pronto para transformar sua gestão de remuneração?
          </h2>
          
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Junte-se às empresas pioneiras que estão revolucionando a forma de gerenciar salários, benefícios e incentivos com inteligência artificial.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 shadow-xl w-full sm:w-auto font-semibold"
              onClick={() => navigate("/auth")}
            >
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-lg px-8 w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10"
              onClick={() => window.location.href = "mailto:contato@compsmart.com.br"}
            >
              <Mail className="mr-2 h-5 w-5" />
              Falar com Consultor
            </Button>
          </div>

          <div className="pt-6 space-y-2">
            <p className="text-sm text-white/80">
              ✓ Teste grátis por 14 dias • ✓ Sem cartão de crédito • ✓ Suporte completo
            </p>
            <p className="text-xs text-white/70">
              Lançamento oficial: Janeiro 2026 • Vagas limitadas para empresas-piloto
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
