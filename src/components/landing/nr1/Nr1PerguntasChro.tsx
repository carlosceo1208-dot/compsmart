import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, Users, DollarSign, LogOut } from 'lucide-react';

const PERGUNTAS = [
  {
    icon: Users,
    titulo: 'Quem no seu Top Talent está em risco psicossocial elevado agora?',
    sub: 'Cruzamos NR-1 com 9Box e mostramos os colaboradores de alto potencial em zona de burnout — antes do pedido de demissão.',
  },
  {
    icon: DollarSign,
    titulo: 'Onde sua estrutura de remuneração está criando estresse silencioso?',
    sub: 'Identificamos clusters de colaboradores com salário defasado E score psicossocial elevado — a combinação que mais gera turnover.',
  },
  {
    icon: LogOut,
    titulo: 'Qual área tem maior correlação entre risco e intenção de saída?',
    sub: 'Dashboard mostra por departamento, gestor e cargo onde a NR-1 está sinalizando rotatividade futura — com 90 dias de antecedência.',
  },
];

export default function Nr1PerguntasChro() {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider nr1-text-primary mb-3">
          <HelpCircle className="h-4 w-4" /> Perguntas que só a CompSmart responde
        </div>
        <h2 className="text-3xl md:text-4xl font-bold">
          O que sua plataforma de NR-1 atual <span className="nr1-text-primary">não consegue te dizer</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {PERGUNTAS.map((p, i) => (
          <Card key={i} className="nr1-card-elevated">
            <CardContent className="pt-6 space-y-3">
              <div className="w-11 h-11 rounded-lg nr1-bg-soft flex items-center justify-center">
                <p.icon className="h-5 w-5 nr1-text-primary" />
              </div>
              <p className="font-semibold leading-snug text-foreground">{p.titulo}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
