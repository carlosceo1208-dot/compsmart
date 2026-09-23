import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Download, ShieldCheck, HeartHandshake, Grid3X3, Wallet } from "lucide-react";
import { DemoDialog } from "@/components/landing/public/DemoDialog";

const CRUZAMENTO = [
  { label: "NR-1", icon: ShieldCheck },
  { label: "Clima", icon: HeartHandshake },
  { label: "9-Box", icon: Grid3X3 },
  { label: "Remuneração", icon: Wallet },
];

export const PivotHero = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-muted/40 py-16 md:py-24">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3 w-3 mr-2" />
          Gestão Estratégica de Pessoas
        </Badge>

        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          Decisões de pessoas com{" "}
          <span className="text-primary">dados e inteligência artificial</span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground">
          Nove módulos independentes, cada um com um agente de IA dedicado, que
          trabalham junto com o seu RH — de cargos e salários a risco
          psicossocial, clima, seleção, desenvolvimento e sucessão.
        </p>

        <div className="rounded-2xl border border-primary/20 bg-card p-5 md:p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-4">
            Só a CompSmart cruza, com IA:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {CRUZAMENTO.map((c, i) => (
              <div key={c.label} className="flex items-center gap-2 md:gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  <c.icon className="h-4 w-4" />
                  {c.label}
                </span>
                {i < CRUZAMENTO.length - 1 && (
                  <span className="text-muted-foreground text-sm">×</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <DemoDialog size="lg" />
          <Button asChild variant="outline" size="lg">
            <Link to="/materiais">
              <Download className="h-4 w-4 mr-2" />
              Baixar e-book Remuneração Estratégica
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
