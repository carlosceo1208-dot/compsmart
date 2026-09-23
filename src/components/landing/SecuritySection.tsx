import { Database, LockKeyhole, ShieldCheck } from "lucide-react";

const safeguards = [
  {
    icon: ShieldCheck,
    title: "Proteção de dados conforme a LGPD",
    description: "Tratamento de dados pessoais com controles de acesso e privacidade.",
  },
  {
    icon: LockKeyhole,
    title: "Dados protegidos em trânsito e em repouso",
    description: "Controles de segurança para as informações da sua empresa.",
  },
  {
    icon: Database,
    title: "Isolamento de dados por empresa",
    description: "Acesso separado por organização e por perfil autorizado.",
  },
];

export const SecuritySection = () => (
  <section className="bg-muted/30 py-16" aria-labelledby="seguranca-title">
    <div className="container mx-auto px-4">
      <h2 id="seguranca-title" className="text-2xl md:text-3xl font-bold text-center mb-8">Proteção de dados</h2>
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        {safeguards.map(({ icon: Icon, title, description }) => (
          <div key={title} className="border border-border bg-card rounded-lg p-6 space-y-3">
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);