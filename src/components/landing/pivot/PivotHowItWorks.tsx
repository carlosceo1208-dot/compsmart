import { ClipboardCheck, ListChecks, LineChart } from "lucide-react";

const PASSOS = [
  {
    icon: ClipboardCheck,
    title: "Diagnóstico",
    body: "Você começa com o diagnóstico gratuito em 2 minutos e importa a base da folha (Excel ou CSV) quando quiser aprofundar.",
  },
  {
    icon: ListChecks,
    title: "Plano",
    body: "Os agentes de IA cruzam os dados e entregam um plano de ação priorizado, com o porquê de cada recomendação.",
  },
  {
    icon: LineChart,
    title: "Acompanhamento",
    body: "Acompanhe a evolução nos dashboards e leve à diretoria métricas que o conselho entende.",
  },
];

export const PivotHowItWorks = () => (
  <section className="py-16 md:py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold">Diagnóstico → Plano → Acompanhamento.</h2>
        <p className="mt-3 text-muted-foreground">
          Você começa com o diagnóstico gratuito, recebe o plano priorizado e acompanha a evolução nos dashboards.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PASSOS.map((p, i) => (
          <div
            key={p.title}
            className="rounded-2xl border border-border bg-card p-6 space-y-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
