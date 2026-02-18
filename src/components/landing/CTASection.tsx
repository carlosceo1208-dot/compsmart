import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mail, Rocket, Users, Calendar } from "lucide-react";
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
          {/* Badge */}
          <div className="flex justify-center">
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm backdrop-blur-sm">
              <Rocket className="h-4 w-4 mr-2" />
              Remuneração + Desempenho integrados — tudo por menos de R$ 6/colaborador
            </Badge>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Pronto para eliminar planilhas e tomar decisões justas baseadas em dados?
          </h2>
          
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Comece seu teste grátis agora. 14 dias para transformar sua gestão de pessoas com desempenho e remuneração integrados.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-white/90 hover:scale-105 text-lg px-8 shadow-xl w-full sm:w-auto font-semibold transition-all duration-300 group"
              onClick={() => navigate("/auth")}
            >
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-lg px-8 w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 hover:scale-105 transition-all duration-300"
              onClick={() => window.location.href = "mailto:contato@compsmart.ia.br"}
            >
              <Mail className="mr-2 h-5 w-5" />
              Falar com Consultor
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 pt-6">
            <div className="flex items-center gap-2 text-white/80">
              <Users className="h-5 w-5" />
              <span><strong className="text-white">100+</strong> empresas interessadas</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Calendar className="h-5 w-5" />
              <span><strong className="text-white">14 dias</strong> de teste grátis</span>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <p className="text-sm text-white/80">
              ✅ 14 dias grátis • ✅ Sem cartão de crédito • ✅ Cancele quando quiser
            </p>
            <p className="text-xs text-white/70">
              Desempenho + Remuneração incluídos em todos os planos • Desconto para plano anual e pagamento via PIX
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};