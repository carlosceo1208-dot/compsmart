import { Upload, Brain, Compass } from "lucide-react";

const PASSOS = [
  {
    icon: Upload,
    title: "Importe a base",
    body: "Envie a planilha Excel ou CSV da sua folha. O mapeamento inteligente reconhece as colunas, valida os dados e mostra um preview antes de gravar.",
  },
  {
    icon: Brain,
    title: "A IA analisa",
    body: "Benchmark de mercado, risco psicossocial, clima, desempenho e gaps de competência são processados pelos agentes de cada módulo.",
  },
  {
    icon: Compass,
    title: "Decida com inteligência",
    body: "Relatórios, planos de ação e alertas prontos para levar à diretoria — com o porquê de cada recomendação.",
  },
];

export const PivotHowItWorks = () => (
  <section className="py-16 md:py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold">Como funciona</h2>
        <p className="mt-3 text-muted-foreground">
          Do arquivo da folha à decisão, em três passos.
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
