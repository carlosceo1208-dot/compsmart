import { Card, CardContent } from "@/components/ui/card";
import { Users, FileX, EyeOff } from "lucide-react";

const CONTRAPONTOS = [
  {
    icon: Users,
    title: "Consultoria cara e dependente de humanos",
    body: "Projetos longos, relatório entregue e conhecimento que vai embora junto com o consultor.",
  },
  {
    icon: FileX,
    title: "Clima que vira PDF esquecido na gaveta",
    body: "A pesquisa acontece, o relatório chega e nenhuma ação sai do papel até o próximo ciclo.",
  },
  {
    icon: EyeOff,
    title: "Anonimato de fachada",
    body: "Recortes pequenos demais permitem identificar quem respondeu — e a confiança acaba.",
  },
];

export const PainSection = () => (
  <section className="py-16 md:py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold">O que não funciona mais</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {CONTRAPONTOS.map((d) => (
          <Card key={d.title} className="rounded-2xl overflow-hidden">
            <div className="h-1 w-full bg-destructive" />
            <CardContent className="p-6 space-y-3">
              <d.icon className="h-6 w-6 text-destructive" />
              <h3 className="font-semibold text-base">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);
