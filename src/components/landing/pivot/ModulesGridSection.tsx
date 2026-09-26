import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Bot } from "lucide-react";
import { LANDING_MODULES } from "@/config/landingModules";

export const ModulesGridSection = () => (
  <section id="modulos" className="py-16 md:py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold">
          Nove módulos, nove agentes de IA
        </h2>
        <p className="mt-3 text-muted-foreground">
          Compre apenas o que precisa. Cada módulo funciona sozinho e fica ainda
          mais forte quando combinado com os outros.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {LANDING_MODULES.map((m) => (
          <Link key={m.slug} to={m.route} className="group">
            <Card className="h-full rounded-2xl border-primary/25 transition-all hover:shadow-lg hover:border-primary/60">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      m.legal
                        ? "rounded-full border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626] text-[10px]"
                        : "rounded-full text-[10px]"
                    }
                  >
                    {m.selo}
                  </Badge>
                </div>
                <h3 className="font-semibold">{m.nomeCurto}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {m.chamada ?? m.resumo}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Bot className="h-3.5 w-3.5" />
                    Agente {m.agente}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </section>
);
