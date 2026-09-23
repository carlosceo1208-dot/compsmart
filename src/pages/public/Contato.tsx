import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock } from "lucide-react";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { LeadForm } from "@/components/landing/public/LeadForm";
import { CONTACT_EMAIL } from "@/config/landingModules";

const Contato = () => (
  <PublicLayout
    title="Contato | CompSmart"
    description="Fale com o time da CompSmart: tire dúvidas sobre os módulos, preços e implantação, ou agende uma demonstração da plataforma."
    path="/contato"
  >
    <section className="py-16 md:py-20 bg-gradient-to-br from-background via-primary/5 to-muted/40">
      <div className="container mx-auto px-4 text-center max-w-2xl space-y-4">
        <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1.5">
          Contato
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold">Vamos conversar</h1>
        <p className="text-muted-foreground md:text-lg">
          Conte o seu desafio de gestão de pessoas e nosso time indica por onde
          começar — sem compromisso.
        </p>
      </div>
    </section>

    <section className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 max-w-5xl mx-auto">
          <div className="space-y-4">
            <Card className="rounded-2xl">
              <CardContent className="p-6 space-y-3">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">E-mail</h2>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-sm text-primary hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-6 space-y-3">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Atendimento</h2>
                <p className="text-sm text-muted-foreground">
                  Respondemos em até 1 dia útil, de segunda a sexta.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardContent className="p-6 md:p-8">
              <LeadForm
                origem="contato"
                fields={["empresa", "cargo", "porte", "mensagem"]}
                submitLabel="Enviar mensagem"
                successTitle="Mensagem enviada!"
                successMessage="Recebemos seu contato e respondemos em até 1 dia útil."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default Contato;
