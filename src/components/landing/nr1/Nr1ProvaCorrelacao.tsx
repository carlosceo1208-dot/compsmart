import { TrendingUp, AlertCircle, Award } from 'lucide-react';

const STATS = [
  {
    icon: AlertCircle,
    valor: '34%',
    titulo: 'do Top Talent com risco psicossocial elevado',
    sub: 'invisível para o gestor — só aparece quando a NR-1 é cruzada com 9Box.',
  },
  {
    icon: TrendingUp,
    valor: '2,3x',
    titulo: 'mais situações de risco identificadas',
    sub: 'antes do desligamento voluntário, comparado a empresas sem o cruzamento.',
  },
  {
    icon: Award,
    valor: '1ª',
    titulo: 'plataforma do Brasil a integrar',
    sub: 'NR-1 + 9Box + Remuneração em um único dashboard para o CHRO.',
  },
];

export default function Nr1ProvaCorrelacao() {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-xs font-bold uppercase tracking-wider nr1-text-primary mb-2">
          Dados que ninguém mais tem
        </p>
        <h2 className="text-3xl md:text-4xl font-bold">
          O que aparece quando os <span className="nr1-text-primary">dados conversam</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {STATS.map((s, i) => (
          <div key={i} className="bg-card border-2 nr1-card-elevated rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full nr1-bg-soft mx-auto flex items-center justify-center">
              <s.icon className="h-6 w-6 nr1-text-primary" />
            </div>
            <p className="text-5xl font-bold nr1-text-primary leading-none">{s.valor}</p>
            <p className="font-semibold text-foreground leading-snug">{s.titulo}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.sub}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6 max-w-xl mx-auto">
        Métricas agregadas de clientes em fase piloto. Resultados podem variar conforme porte
        e maturidade do programa de gestão de pessoas.
      </p>
    </section>
  );
}
