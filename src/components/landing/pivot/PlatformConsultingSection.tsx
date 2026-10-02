import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, LayoutDashboard } from "lucide-react";
import { LANDING_MODULES } from "@/config/landingModules";

const rh = LANDING_MODULES.find((m) => m.slug === "rh-service");

const PLATAFORMA = [
  "8 módulos, cada um com seu agente de IA",
  "Automação de diagnósticos, análises e relatórios",
  "Dados que se cruzam entre NR-1, clima, desempenho e remuneração",
];

const HR_SERVICES = [
  "Consultores seniores por demanda, por projeto ou por horas",
  "Interpretam os dados da plataforma com o seu RH",
  "Conduzem da análise ao plano de ação",
];

export const PlatformConsultingSection = () => (
  <section id="modelo" className="py-16 md:py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold">
          A estrutura a gente entrega. O resultado, também.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Plataforma e consultoria no mesmo modelo: Outcome as a Service (OaaS),
          em que o compromisso é com o resultado, não só com a ferramenta.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <Card className="rounded-2xl border-primary/25">
          <CardContent className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className="rounded-full text-[10px]">SaaS</Badge>
            </div>
            <h3 className="text-xl font-semibold">Plataforma</h3>
            <ul className="space-y-2">
              {PLATAFORMA.map((t) => (
                <li key={t} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-primary/25 bg-primary/5">
          <CardContent className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                {rh && <rh.icon className="h-5 w-5 text-primary" />}
              </div>
              <Badge variant="outline" className="rounded-full text-[10px]">{rh?.selo ?? "CONSULTORIA"}</Badge>
            </div>
            <h3 className="text-xl font-semibold">HR Services</h3>
            <ul className="space-y-2">
              {HR_SERVICES.map((t) => (
                <li key={t} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
            {rh && (
              <Link to={rh.route} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Conhecer o HR Services <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);
