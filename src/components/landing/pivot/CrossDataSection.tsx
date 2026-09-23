import { Card, CardContent } from "@/components/ui/card";
import { Flame, ShieldAlert } from "lucide-react";

const EXEMPLOS = [
  {
    icon: Flame,
    title: "Burnout × Remuneração",
    body: "A área com maior sobrecarga no diagnóstico psicossocial é a mesma que está abaixo da faixa salarial — o risco de perda deixa de ser suposição e passa a ter endereço.",
  },
  {
    icon: ShieldAlert,
    title: "Risco psicossocial × Sucessão",
    body: "Uma área com clima em queda e riscos psicossociais elevados merece atenção: os planos de sucessão podem ser revisados sem identificar respostas individuais.",
  },
];

export const CrossDataSection = () => (
  <section className="py-16 md:py-20 bg-primary/5">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold">
          Só a CompSmart cruza esses dados
        </h2>
        <p className="mt-3 text-muted-foreground">
          NR-1, clima, potencial e remuneração no mesmo lugar — e a IA mostra o
          que a combinação revela.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {EXEMPLOS.map((e) => (
          <Card key={e.title} className="rounded-2xl bg-card">
            <CardContent className="p-6 space-y-3">
              <div className="p-2.5 rounded-xl bg-primary/10 w-fit">
                <e.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{e.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {e.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);
