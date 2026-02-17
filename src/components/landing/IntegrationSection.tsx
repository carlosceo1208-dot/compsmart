import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Gift, Scale, Wand2, CreditCard, TrendingUp, Target, RotateCcw, GraduationCap, LayoutGrid, MessageSquare, Award, ArrowLeftRight, Sparkles } from "lucide-react";

const compensationItems = [
  { icon: BarChart3, label: "Tabelas e Faixas Salariais" },
  { icon: Gift, label: "ICP: PLR, Bônus, Comissões" },
  { icon: TrendingUp, label: "ILP: Stock Options, RSU, Phantom Shares" },
  { icon: Wand2, label: "Simulação de Cenários e Dissídio" },
  { icon: CreditCard, label: "Budget e Headcount" },
  { icon: Scale, label: "Equidade Interna e Compliance" },
];

const performanceItems = [
  { icon: Target, label: "Metas Cascateadas (OKRs)" },
  { icon: RotateCcw, label: "Avaliação 90°, 180°, 360°" },
  { icon: GraduationCap, label: "PDI (Plano de Desenvolvimento)" },
  { icon: LayoutGrid, label: "9Box + Plano de Sucessão" },
  { icon: Award, label: "Reconhecimento" },
  { icon: MessageSquare, label: "1:1 Contínuo" },
];

export const IntegrationSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <Badge className="bg-secondary/10 text-secondary border-secondary/20 mb-4">
            A ÚNICA PLATAFORMA QUE CONECTA TUDO
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Remuneração Estratégica com Avaliação de Desempenho <span className="text-primary">integrada nativamente</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A gestão de remuneração é o core do CompSmart. Cada avaliação de desempenho — metas, competências, 9Box, PDI — alimenta automaticamente as decisões salariais. <strong>Remuneração justa porque baseada em dados reais de performance.</strong>
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-5 py-2 text-sm shadow-lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Desempenho + Remuneração incluídos — Sem custo adicional
          </Badge>
        </div>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          {/* Compensation Block (LEFT - protagonist) */}
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="font-bold text-lg">Remuneração Estratégica</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {compensationItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <item.icon className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow connector */}
          <div className="hidden md:flex flex-col items-center gap-2">
            <ArrowLeftRight className="h-8 w-8 text-primary animate-pulse-slow" />
            <span className="text-xs text-muted-foreground font-medium text-center whitespace-nowrap">INTEGRAÇÃO<br />EM TEMPO REAL</span>
            <span className="text-[10px] text-primary font-medium text-center">Desempenho alimenta<br />decisões de remuneração</span>
          </div>
          <div className="md:hidden flex justify-center py-2">
            <ArrowLeftRight className="h-6 w-6 text-primary animate-pulse-slow rotate-90" />
          </div>

          {/* Performance Block (RIGHT - complementary) */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Avaliação de Desempenho</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {performanceItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <item.icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
          Não é integração via API. É um sistema único, pensado junto desde o início. Cada avaliação alimenta automaticamente as decisões de remuneração, bônus e promoção.
        </p>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/5"
            onClick={() => document.getElementById("interactive-demo")?.scrollIntoView({ behavior: "smooth" })}
          >
            Ver a Integração em Ação
          </Button>
        </div>
      </div>
    </section>
  );
};
