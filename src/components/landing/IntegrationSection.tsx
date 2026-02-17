import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, RotateCcw, TrendingUp, GraduationCap, LayoutGrid, MessageSquare, BarChart3, Gift, Scale, Wand2, CreditCard, FileCheck, ArrowLeftRight, Sparkles } from "lucide-react";

const performanceItems = [
  { icon: Target, label: "Metas e OKRs" },
  { icon: RotateCcw, label: "Avaliação 90°, 180°, 360°" },
  { icon: TrendingUp, label: "PDI (Plano de Desenvolvimento)" },
  { icon: GraduationCap, label: "Competências" },
  { icon: LayoutGrid, label: "9Box" },
  { icon: MessageSquare, label: "1:1 Contínuo" },
];

const compensationItems = [
  { icon: BarChart3, label: "Faixas Salariais" },
  { icon: Gift, label: "Bônus e PLR" },
  { icon: Scale, label: "Equidade Interna" },
  { icon: Wand2, label: "Simulação de Cenários" },
  { icon: CreditCard, label: "Budget Control" },
  { icon: FileCheck, label: "Compliance Salarial" },
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
            Desempenho e Remuneração finalmente <span className="text-primary">conversam entre si</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Avalie com precisão. Remunere com justiça. Tudo integrado, <strong>sem custo adicional</strong>.
          </p>
        </div>

        {/* Badge flutuante */}
        <div className="flex justify-center mb-8">
          <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-5 py-2 text-sm shadow-lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Desempenho + Remuneração incluídos — Sem custo adicional
          </Badge>
        </div>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          {/* Performance Block */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Avaliação de Desempenho</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {performanceItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <item.icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow connector */}
          <div className="hidden md:flex flex-col items-center gap-2">
            <ArrowLeftRight className="h-8 w-8 text-primary animate-pulse-slow" />
            <span className="text-xs text-muted-foreground font-medium text-center whitespace-nowrap">INTEGRAÇÃO<br />EM TEMPO REAL</span>
          </div>
          <div className="md:hidden flex justify-center py-2">
            <ArrowLeftRight className="h-6 w-6 text-primary animate-pulse-slow rotate-90" />
          </div>

          {/* Compensation Block */}
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="font-bold text-lg">Remuneração Estratégica</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {compensationItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <item.icon className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
          Cada avaliação de desempenho alimenta automaticamente as decisões de remuneração. Não é integração via API. É um sistema único, pensado junto desde o início.
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
