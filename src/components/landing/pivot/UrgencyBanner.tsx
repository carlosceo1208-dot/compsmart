import { ShieldCheck } from "lucide-react";

export const UrgencyBanner = () => (
  <section className="border-y border-primary/10 bg-primary/5 py-4" aria-label="Preparação para a NR-1">
    <div className="container mx-auto px-4 flex items-start justify-center gap-3 text-sm text-foreground">
      <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <p><strong>Riscos psicossociais:</strong> a obrigação de identificar e gerenciar permanece. Prepare sua empresa para a fiscalização.</p>
    </div>
  </section>
);