import { ClipboardCheck, Grid3x3, Wallet, BrainCircuit, Target, HeartPulse, LineChart } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    icon: ClipboardCheck,
    titulo: 'Diagnóstico NR-1',
    sub: 'Inventário psicossocial COPSOQ-III (40 questões, 6 dimensões) com relatórios agregados e proteção de respostas individuais.',
  },
  {
    n: '02',
    icon: HeartPulse,
    titulo: 'Pesquisa de Clima',
    sub: 'Com o módulo de Clima contratado, compare indicadores agregados de eNPS, engajamento e liderança com os fatores psicossociais.',
  },
  {
    n: '03',
    icon: LineChart,
    titulo: 'Avaliação de Desempenho',
    sub: 'Com o módulo Core contratado, acompanhe ciclos de avaliação, metas e competências em conjunto com indicadores agregados de risco.',
  },
  {
    n: '04',
    icon: Grid3x3,
    titulo: 'Matriz 9Box',
    sub: 'Com Potencial & Sucessão contratado, avalie desempenho × potencial sem vincular respostas individuais da NR-1 a pessoas.',
  },
  {
    n: '05',
    icon: Wallet,
    titulo: 'Remuneração & Equidade',
    sub: 'Com Remuneração contratada, analise faixas salariais e indicadores autorizados em conjunto com resultados agregados.',
  },
  {
    n: '06',
    icon: BrainCircuit,
    titulo: 'Dashboard de Inteligência',
    sub: 'Visualize tendências de risco × clima × desempenho × 9-Box × remuneração conforme os módulos contratados e as permissões aplicáveis.',
  },
  {
    n: '07',
    icon: Target,
    titulo: 'Plano de ação por ROI',
    sub: 'Registre responsáveis, prazos e acompanhamento de cada ação para apoiar as decisões do RH e da liderança.',
  },
];

export default function Nr1ComoFunciona({ idAnchor }: { idAnchor?: string }) {
  return (
    <section id={idAnchor} className="container mx-auto px-4 py-14">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Como funciona o cruzamento{' '}
          <span className="nr1-text-primary">
            NR-1 × Clima × Desempenho × 9Box × Remuneração
          </span>
        </h2>
        <p className="text-muted-foreground">
          7 etapas para apoiar decisões do RH. NR-1 funciona de forma autônoma; as demais etapas dependem dos módulos contratados.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {STEPS.map((s) => (
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
          </div>
        ))}
      </div>
    </section>
  );
}
