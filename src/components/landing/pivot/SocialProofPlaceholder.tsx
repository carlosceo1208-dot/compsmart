import { Building2 } from "lucide-react";

export const SocialProofPlaceholder = () => (
  <section className="py-16 md:py-20 bg-muted/30">
    <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
      <h2 className="text-2xl md:text-4xl font-bold">Empresas-piloto</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Espaços reservados para logos">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-2xl border border-dashed border-border bg-card flex items-center justify-center text-muted-foreground">
            <Building2 className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Espaço reservado para logo</span>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm space-y-2 max-w-xl mx-auto">
        <span className="inline-flex rounded-full bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Exemplo real anonimizado
        </span>
        <p className="text-foreground">
          Empresa com 10 respondentes — risco psicossocial{" "}
          <strong className="text-destructive">49,93 (crítico)</strong>.
        </p>
      </div>
    </div>
  </section>
);
