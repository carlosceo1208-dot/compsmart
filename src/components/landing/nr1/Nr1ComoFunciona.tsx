import { ClipboardCheck, Grid3x3, Wallet, BrainCircuit, Target } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    icon: ClipboardCheck,
    titulo: 'Diagnóstico NR-1',
    sub: 'Inventário psicossocial COPSOQ-III (40 questões, 6 dimensões) com respostas 100% anônimas — LGPD-compliant.',
  },
  {
    n: '02',
    icon: Grid3x3,
    titulo: 'Importação 9Box',
    sub: 'Conectamos sua matriz de desempenho × potencial. Se você ainda não tem 9Box, a CompSmart constrói para você.',
  },
  {
    n: '03',
    icon: Wallet,
    titulo: 'Cruzamento de Remuneração',
    sub: 'Mapeamos faixas salariais, defasagem em relação ao mercado e posicionamento individual em cada cargo.',
  },
  {
    n: '04',
    icon: BrainCircuit,
    titulo: 'Dashboard de Inteligência',
    sub: 'Clusters automáticos de risco × potencial × salário. Alertas de retenção priorizados por impacto financeiro.',
  },
  {
    n: '05',
    icon: Target,
    titulo: 'Plano de ação por ROI',
    sub: 'Não é apenas compliance: cada ação tem custo, ganho de retenção estimado e responsável. Pronto para o board.',
  },
];

export default function Nr1ComoFunciona({ idAnchor }: { idAnchor?: string }) {
  return (
    <section id={idAnchor} className="container mx-auto px-4 py-14">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Como funciona o cruzamento <span className="nr1-text-primary">NR-1 × 9Box × Remuneração</span>
        </h2>
        <p className="text-muted-foreground">
          5 passos. Do dado bruto à decisão estratégica de retenção.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
        {STEPS.map((s, i) => (
          <div key={s.n} className="relative">
            <div className="bg-card border rounded-xl p-5 h-full hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg nr1-bg-primary flex items-center justify-center">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold text-muted-foreground/30">{s.n}</span>
              </div>
              <p className="font-semibold leading-snug">{s.titulo}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.sub}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-2 -translate-y-1/2 text-muted-foreground/30 font-light text-xl z-10">
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
