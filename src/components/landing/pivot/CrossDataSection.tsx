import { ShieldCheck, HeartHandshake, Grid3X3, Wallet, LayoutDashboard } from "lucide-react";

const MODULOS = [
  { label: "NR-1", icon: ShieldCheck },
  { label: "Clima", icon: HeartHandshake },
  { label: "9-Box", icon: Grid3X3 },
  { label: "Remuneração", icon: Wallet },
];

/** Diferencial: 4 módulos convergindo para um painel (desenho em código). */
export const CrossDataSection = () => (
  <section className="py-16 md:py-20 bg-primary/5">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold">
          Só a CompSmart cruza NR-1 × Clima × 9-Box × Remuneração
        </h2>
        <p className="mt-3 text-muted-foreground">
          Cada módulo funciona sozinho. O valor aparece no cruzamento: onde está
          o risco, quem é pessoa-chave e o que o mercado paga — na mesma tela,
          sempre por grupo, nunca por pessoa.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
        <div className="contents md:flex md:flex-col md:gap-4">
          {MODULOS.slice(0, 2).map((m) => <Chip key={m.label} {...m} />)}
        </div>
        <div className="col-span-2 md:col-span-1 order-last md:order-none flex flex-col items-center gap-3">
          <svg viewBox="0 0 200 40" className="hidden md:block w-40 text-primary/40" aria-hidden="true">
            <path d="M0 5 Q100 5 100 20 M0 35 Q100 35 100 20 M200 5 Q100 5 100 20 M200 35 Q100 35 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
          <div className="rounded-2xl border border-primary/30 bg-card shadow-lg p-5 w-full max-w-xs text-center space-y-2">
            <div className="mx-auto w-fit p-3 rounded-xl bg-primary text-primary-foreground">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <p className="font-semibold">Painel cruzado</p>
            <p className="text-xs text-muted-foreground">
              Risco, clima, potencial e remuneração num só lugar.
            </p>
          </div>
        </div>
        <div className="contents md:flex md:flex-col md:gap-4">
          {MODULOS.slice(2).map((m) => <Chip key={m.label} {...m} />)}
        </div>
      </div>
    </div>
  </section>
);

const Chip = ({ label, icon: Icon }: (typeof MODULOS)[number]) => (
  <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div className="p-2 rounded-xl bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <span className="font-semibold text-sm">{label}</span>
  </div>
);
