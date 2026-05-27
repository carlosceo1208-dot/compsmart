import { ClipboardCheck, Grid3x3, Wallet, BrainCircuit, Target, HeartPulse, LineChart } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    icon: ClipboardCheck,
    titulo: 'Diagnóstico NR-1',
    sub: 'Inventário psicossocial COPSOQ-III (40 questões, 6 dimensões) com respostas 100% anônimas — LGPD-compliant.',
  },
  {
    n: '02',
    icon: HeartPulse,
    titulo: 'Pesquisa de Clima',
    sub: 'Cruzamos percepção do colaborador (eNPS, engajamento, liderança) com os fatores psicossociais para identificar causas-raiz.',
  },
  {
    n: '03',
    icon: LineChart,
    titulo: 'Avaliação de Desempenho',
    sub: 'Integramos ciclos de avaliação (90°, 180°, 360°), metas e competências para conectar entrega × risco psicossocial.',
  },
  {
    n: '04',
    icon: Grid3x3,
    titulo: 'Matriz 9Box',
    sub: 'Cruzamos desempenho × potencial. Se você ainda não tem 9Box, a CompSmart constrói automaticamente a partir dos seus ciclos.',
  },
  {
    n: '05',
    icon: Wallet,
    titulo: 'Remuneração & Equidade',
    sub: 'Mapeamos faixas salariais, defasagem de mercado, compa-ratio e posicionamento individual em cada cargo.',
  },
  {
    n: '06',
    icon: BrainCircuit,
    titulo: 'Dashboard de Inteligência',
    sub: 'Clusters automáticos de risco × clima × desempenho × 9Box × salário. Alertas priorizados por impacto financeiro de retenção.',
  },
  {
    n: '07',
    icon: Target,
    titulo: 'Plano de ação por ROI',
    sub: 'Não é apenas compliance: cada ação tem custo, ganho de retenção estimado e responsável. Pronto para o board.',
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
          7 passos. Do dado bruto à decisão estratégica de retenção, com coerência entre pessoas, performance e folha.
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
