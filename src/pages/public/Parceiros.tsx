import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Handshake, Percent, BriefcaseBusiness, Check } from "lucide-react";
import { ImageSlot } from "@/components/landing/public/ImageSlot";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { LeadForm } from "@/components/landing/public/LeadForm";

const MODALIDADES = [
  {
    icon: Percent,
    badge: "Indique e ganhe",
    title: "Comissão recorrente de 10%",
    items: [
      "10% sobre o valor pago pelo cliente, enquanto a assinatura estiver ativa",
      "Atribuição por link ou cupom exclusivo do parceiro",
      "Acompanhamento das indicações pelo nosso time comercial",
      "Sem exigência de certificação técnica",
    ],
  },
  {
    icon: BriefcaseBusiness,
    badge: "Atue como consultor",
    title: "Consultoria sênior pela plataforma",
    items: [
      "Remuneração pelas horas trabalhadas nos projetos",
      "Você integra a base de consultores do RH Service",
      "Especialidades: remuneração, NR-1, clima, cargos, desempenho e mais",
      "Sujeito a aprovação e qualificação da equipe CompSmart",
    ],
  },
];

const Parceiros = () => (
  <PublicLayout
    title="Parceiros | CompSmart"
    description="Duas formas de ser parceiro CompSmart: indique e ganhe 10% recorrente enquanto a assinatura estiver ativa, ou atue como consultor sênior pela plataforma."
    path="/parceiros"
  >
    <section className="py-16 md:py-20 bg-gradient-to-br from-background via-primary/5 to-muted/40">
      <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
        <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1.5">
          <Handshake className="h-3.5 w-3.5 mr-2" />
          Programa de parceiros
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold">
          Cresça junto com a CompSmart
        </h1>
        <p className="text-muted-foreground md:text-lg">
          Indique empresas e receba comissão recorrente, ou atue como consultor
          sênior dentro da plataforma. Você pode escolher as duas.
        </p>
      </div>
    </section>

    <section className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {MODALIDADES.map((m) => (
            <Card key={m.badge} className="rounded-2xl h-full">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="p-2.5 rounded-xl bg-primary/10 w-fit">
                  <m.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className="rounded-full text-xs">
                  {m.badge}
                </Badge>
                <h2 className="text-xl font-bold">{m.title}</h2>
                <ul className="space-y-2.5">
                  {m.items.map((i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-[#16A34A] mt-0.5 shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <section className="py-14 bg-muted/30">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto rounded-2xl">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Quero ser parceiro</h2>
              <p className="text-sm text-muted-foreground">
                Preencha os dados e nosso time entra em contato para explicar as
                condições e os próximos passos.
              </p>
            </div>
            <LeadForm
              origem="parceiro"
              fields={[
                "empresa",
                "parceria_tipo",
                "especialidade",
                "linkedin",
                "mensagem",
              ]}
              submitLabel="Quero ser parceiro"
              successTitle="Cadastro enviado!"
              successMessage="Nosso time comercial entra em contato em até 2 dias úteis."
            />
          </CardContent>
        </Card>
      </div>
    </section>
  <section className="py-14 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <ImageSlot label="Imagem D" alt="Consultores seniores em mentoria" />
        </div>
      </section>
    </PublicLayout>
);

export default Parceiros;
