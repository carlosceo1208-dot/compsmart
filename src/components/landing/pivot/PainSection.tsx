import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ShieldAlert, HelpCircle } from "lucide-react";

const DORES = [
  {
    icon: AlertTriangle,
    title: "Remuneração desorganizada e rotatividade alta",
    body: "Salários definidos caso a caso, planilhas paralelas e nenhuma régua de mérito — o talento sai antes de você perceber a defasagem.",
    color: "text-[#DC2626]",
    bar: "bg-[#DC2626]",
  },
  {
    icon: ShieldAlert,
    title: "NR-1 sem ferramenta para cumprir",
    body: "A obrigação de identificar e gerenciar riscos psicossociais permanece. O RH precisa se preparar com instrumentos, registros e plano de ação.",
    color: "text-[#F59E0B]",
    bar: "bg-[#F59E0B]",
  },
  {
    icon: HelpCircle,
    title: "Decisões tomadas por intuição",
    body: "Clima, desempenho, potencial e salário vivem em arquivos separados, então cada decisão depende de percepção, não de evidência.",
    color: "text-primary",
    bar: "bg-primary",
  },
];

export const PainSection = () => (
  <section className="py-16 md:py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold">
          Quanto custa decidir RH no achismo?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Vaga parada, salário fora da faixa, talento que sai sem aviso, risco
          psicossocial crescendo em silêncio. Cada decisão sem dado custa caro — e
          ninguém percebe até o dano aparecer.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {DORES.map((d) => (
          <Card key={d.title} className="rounded-2xl overflow-hidden">
            <div className={`h-1 w-full ${d.bar}`} />
            <CardContent className="p-6 space-y-3">
              <d.icon className={`h-6 w-6 ${d.color}`} />
              <h3 className="font-semibold text-base">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {d.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);
