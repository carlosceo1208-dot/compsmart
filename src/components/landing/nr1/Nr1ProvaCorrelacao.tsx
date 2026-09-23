import { ShieldCheck } from 'lucide-react';

export default function Nr1ProvaCorrelacao() {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-xs font-bold uppercase tracking-wider nr1-text-primary mb-2">Acompanhe a evolução</p>
        <h2 className="text-3xl md:text-4xl font-bold">
          O que aparece quando os <span className="nr1-text-primary">dados conversam</span>
        </h2>
      </div>

      <div className="border border-border bg-card rounded-lg p-8 text-center max-w-2xl mx-auto space-y-3">
        <ShieldCheck className="h-7 w-7 nr1-text-primary mx-auto" aria-hidden="true" />
        <h3 className="text-xl font-semibold">Resultados em breve</h3>
        <p className="text-sm text-muted-foreground">Acompanhe indicadores de risco psicossocial de forma agregada. Cruzamentos com Clima, 9-Box e Remuneração dependem da contratação dos módulos complementares.</p>
      </div>
    </section>
  );
}
