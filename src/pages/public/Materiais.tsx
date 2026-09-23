import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Download, Lock } from "lucide-react";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { LeadForm } from "@/components/landing/public/LeadForm";
import type { LeadOrigem } from "@/hooks/usePublicLead";

interface Material {
  slug: string;
  origem: LeadOrigem;
  titulo: string;
  beneficio: string;
  disponivel: boolean;
}

const MATERIAIS: Material[] = [
  {
    slug: "remuneracao",
    origem: "ebook:remuneracao",
    titulo:
      "Remuneração Estratégica — Como atrair e reter talentos com um pacote de remuneração total competitivo",
    beneficio:
      "O caminho prático para estruturar cargos, faixas, benefícios e incentivos que sustentam a retenção.",
    disponivel: true,
  },
  {
    slug: "nr1",
    origem: "ebook:nr1",
    titulo: "NR-1 e Riscos Psicossociais",
    beneficio:
      "O que a norma exige, como fazer o diagnóstico anônimo e como documentar o plano de ação.",
    disponivel: false,
  },
  {
    slug: "clima-9box",
    origem: "ebook:clima-9box",
    titulo: "Clima e 9-Box",
    beneficio:
      "Como ligar percepção de clima, desempenho e potencial às decisões de retenção e sucessão.",
    disponivel: false,
  },
];

const Materiais = () => {
  const [ativo, setAtivo] = useState<Material | null>(null);

  return (
    <PublicLayout
      title="Materiais e e-books | CompSmart"
      description="Materiais gratuitos sobre remuneração estratégica, NR-1 e riscos psicossociais, clima e 9-Box para times de RH e lideranças."
      path="/materiais"
    >
      <section className="py-16 md:py-20 bg-gradient-to-br from-background via-primary/5 to-muted/40">
        <div className="container mx-auto px-4 text-center max-w-2xl space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1.5">
            <BookOpen className="h-3.5 w-3.5 mr-2" />
            Materiais
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold">
            Conteúdo para decidir melhor
          </h1>
          <p className="text-muted-foreground md:text-lg">
            Materiais práticos, escritos por quem vive gestão de pessoas todos os
            dias.
          </p>
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {MATERIAIS.map((m) => (
              <Card key={m.slug} className="rounded-2xl h-full flex flex-col">
                <div className="aspect-[4/3] rounded-t-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-muted flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-primary/70" />
                </div>
                <CardContent className="p-6 space-y-3 flex-1 flex flex-col">
                  {!m.disponivel && (
                    <Badge variant="outline" className="rounded-full text-[10px] w-fit">
                      Em breve
                    </Badge>
                  )}
                  <h2 className="font-semibold text-base leading-snug">
                    {m.titulo}
                  </h2>
                  <p className="text-sm text-muted-foreground flex-1">
                    {m.beneficio}
                  </p>
                  {m.disponivel ? (
                    <Button onClick={() => setAtivo(m)}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      <Lock className="h-4 w-4 mr-2" />
                      Em produção
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!ativo} onOpenChange={(o) => !o && setAtivo(null)}>
        <DialogContent className="max-w-lg bg-background">
          <DialogHeader>
            <DialogTitle>Receber o material</DialogTitle>
            <DialogDescription>
              Informe seus dados e enviamos o material para o seu e-mail
              profissional.
            </DialogDescription>
          </DialogHeader>
          {ativo && (
            <LeadForm
              origem={ativo.origem}
              leadMagnet={ativo.slug}
              fields={["empresa", "cargo", "porte"]}
              submitLabel="Quero receber"
              successTitle="Pronto!"
              successMessage="Enviamos o material para o e-mail informado. Se não aparecer em alguns minutos, confira a caixa de spam."
            />
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
};

export default Materiais;
