import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";
import { LANDING_MODULES } from "@/config/landingModules";

/** Grade dos 8 agentes de IA (HR Services fica fora — seção Plataforma + Consultoria). */
const AGENTES = LANDING_MODULES.filter((m) => m.slug !== "rh-service");

export const ModulesGridSection = () => (
  <section id="modulos" className="py-16 md:py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold">8 agentes de IA, um em cada módulo</h2>
        <p className="mt-3 text-muted-foreground">
          Compre só o que precisa. Cada módulo funciona sozinho e fica mais forte combinado.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 max-w-6xl mx-auto">
        {AGENTES.map((m) => (
          <Link key={m.slug} to={m.route} className="group">
            <Card className="h-full rounded-2xl border-primary/25 transition-all hover:shadow-lg hover:border-primary/60">
              <CardContent className="p-4 md:p-5 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    <Sparkles className="h-3 w-3" /> IA
                  </span>
                </div>
                <h3 className="font-semibold text-sm md:text-base">{m.nomeCurto}</h3>
                <p className="text-xs font-medium text-primary">Agente {m.agente}</p>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{m.resumo}</p>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </section>
);
