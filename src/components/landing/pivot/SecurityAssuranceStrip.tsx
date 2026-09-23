import { Database, LockKeyhole, ShieldCheck } from "lucide-react";

const practices = [
  { icon: ShieldCheck, label: "Proteção de dados conforme a LGPD" },
  { icon: LockKeyhole, label: "Dados protegidos em trânsito e em repouso" },
  { icon: Database, label: "Isolamento de dados por empresa" },
];

export const SecurityAssuranceStrip = () => (
  <section className="border-b border-border bg-background py-5" aria-label="Proteção de dados">
    <div className="container mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-3">
      {practices.map(({ icon: Icon, label }) => (
        <div key={label} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  </section>
);