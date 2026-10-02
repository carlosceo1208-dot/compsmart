import { useState } from "react";
import { Link } from "react-router-dom";
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
import { ArrowRight, Bell, BookOpen, Download } from "lucide-react";
import { LeadForm } from "@/components/landing/public/LeadForm";
import { EbookDownloadDialog } from "@/components/landing/public/EbookDownloadDialog";
import { MATERIAIS, type MaterialPublico } from "@/config/materiais";
import simboloCrescimento from "@/assets/simbolo-crescimento.png.asset.json";

interface Props {
  /** compact = Home (cabeçalho + link para /materiais); full = página /materiais. */
  variant?: "compact" | "full";
}

export const MaterialsSection = ({ variant = "full" }: Props) => {
  const [ativo, setAtivo] = useState<MaterialPublico | null>(null);
  const compact = variant === "compact";

  return (
    <section
      id={compact ? "materiais" : undefined}
      className={compact ? "py-16 md:py-20 bg-muted/30" : "py-14 bg-background"}
    >
      <div className="container mx-auto px-4">
        {compact && (
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-bold">Materiais gratuitos</h2>
            <p className="mt-3 text-muted-foreground">
              Conteúdo prático para o RH decidir melhor.
            </p>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {MATERIAIS.map((m) => {
            const disponivel = m.status === "disponivel";
            return (
              <Card key={m.slug} className="rounded-2xl h-full flex flex-col">
                {!compact && (
                  <div className="aspect-[4/3] rounded-t-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-muted flex items-center justify-center">
                    {m.slug === "remuneracao" ? (
                      <img
                        src={simboloCrescimento.url}
                        alt="Símbolo de crescimento estratégico"
                        className="size-24 rounded-2xl object-cover shadow-sm"
                      />
                    ) : (
                      <BookOpen className="h-10 w-10 text-primary/70" />
                    )}
                  </div>
                )}
                <CardContent className="p-6 space-y-3 flex-1 flex flex-col">
                  {!disponivel && (
                    <Badge variant="outline" className="rounded-full text-[10px] w-fit">
                      Em breve
                    </Badge>
                  )}
                  <h3 className="font-semibold text-base leading-snug">{m.titulo}</h3>
                  <p className="text-sm text-muted-foreground flex-1">{m.beneficio}</p>
                  {disponivel ? (
                    <Button id={m.ctaId} onClick={() => setAtivo(m)}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  ) : (
                    <Button id={m.ctaId} variant="outline" onClick={() => setAtivo(m)}>
                      <Bell className="h-4 w-4 mr-2" />
                      Avise-me quando sair
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {compact && (
          <div className="text-center mt-8">
            <Button asChild variant="link">
              <Link to="/materiais">
                Ver todos os materiais <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      <EbookDownloadDialog
        open={ativo?.status === "disponivel"}
        onOpenChange={(o) => !o && setAtivo(null)}
      />

      <Dialog
        open={ativo?.status === "em_breve"}
        onOpenChange={(o) => !o && setAtivo(null)}
      >
        <DialogContent className="max-w-lg bg-background max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avise-me quando sair</DialogTitle>
            <DialogDescription>
              Este material ainda está em produção. Deixe seus dados e enviamos
              quando estiver pronto.
            </DialogDescription>
          </DialogHeader>
          {ativo && (
            <LeadForm
              origem={ativo.origem}
              leadMagnet={ativo.leadMagnet}
              fields={["empresa", "cargo", "porte"]}
              submitLabel="Quero receber quando sair"
              successTitle="Interesse registrado!"
              successMessage="Enviamos quando estiver pronto, para o e-mail informado."
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
