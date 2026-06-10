import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Network, MessageCircle, FileCheck } from 'lucide-react';

const NOVIDADES = [
  {
    icon: Network,
    tag: 'Exclusivo',
    title: 'Cruzamento NR-1 × 9Box × Remuneração',
    desc: 'Único no mercado: identifica talentos de alto desempenho em zona de burnout antes do pedido de demissão — conectando risco psicossocial, avaliação 9Box e equidade salarial em um único painel.',
  },
  {
    icon: MessageCircle,
    tag: 'Novo',
    title: 'Pesquisa de Clima integrada + correlação COPSOQ',
    desc: 'Causa raiz unificada entre clima organizacional e risco psicossocial. A IA cruza as 10 dimensões de clima com as 6 dimensões COPSOQ-III e gera um plano de ação único, sem duplicar esforços.',
  },
  {
    icon: FileCheck,
    tag: 'Compliance',
    title: 'Relatórios LGPD-compliant para fiscalização',
    desc: 'Exportação PDF anonimizada pronta para auditoria do MTE. Respostas individuais 100% anônimas (k-anonymity), trilha de auditoria completa e retenção configurável.',
  },
];

export default function Nr1Novidades() {
  return (
    <section id="novidades" className="container mx-auto px-4 py-14 nr1-bg-soft">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <Badge className="nr1-bg-primary text-white border-0 mb-3 gap-1">
          <Sparkles className="h-3 w-3" /> Novidades NR-1
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">O que só a CompSmart entrega</h2>
        <p className="text-muted-foreground">
          Três diferenciais que transformam a obrigação NR-1 em vantagem competitiva de gestão de pessoas.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3 max-w-6xl mx-auto">
        {NOVIDADES.map((n, i) => (
          <Card key={i} className="border-2 hover:border-[hsl(var(--nr1-primary)/0.4)] transition-colors">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg nr1-bg-primary flex items-center justify-center">
                  <n.icon className="h-5 w-5 text-white" />
                </div>
                <Badge variant="outline" className="text-[10px] nr1-text-primary border-[hsl(var(--nr1-primary)/0.4)]">
                  {n.tag}
                </Badge>
              </div>
              <h3 className="font-bold text-lg leading-tight">{n.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{n.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
