import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Mail, Loader2 } from "lucide-react";
import { ImageSlot } from "@/components/landing/public/ImageSlot";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { PricingSimulator } from "@/components/landing/pivot/PricingSimulator";
import { DemoDialog } from "@/components/landing/public/DemoDialog";
import { PivotFAQSection } from "@/components/landing/pivot/PivotFAQSection";
import {
  usePublicPricing,
  additionalModulePrice,
  formatBRL,
} from "@/hooks/usePublicPricing";
import { CONTACT_EMAIL } from "@/config/landingModules";

const Precos = () => {
  const { data: pricing, isLoading } = usePublicPricing();

  return (
    <PublicLayout
      title="Preços | CompSmart"
      description="Confira os preços públicos por colaborador e por módulo, as faixas de porte e simule seu investimento na CompSmart."
      path="/precos"
    >
      <section className="py-16 md:py-20 bg-gradient-to-br from-background via-primary/5 to-muted/40">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1.5">
            Preços
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold">
            Você paga por módulo e por colaborador
          </h1>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          ) : pricing ? (
            <p className="text-muted-foreground text-base md:text-lg">
              A partir de{" "}
              <strong className="text-foreground">
                {formatBRL(pricing.preco_base_colaborador)} por colaborador/mês
                por módulo
              </strong>
              . Do 2º módulo em diante,{" "}
              {pricing.desconto_modulo_adicional_pct}% de desconto (
              {formatBRL(additionalModulePrice(pricing))} por colaborador/mês).
              Semestral {pricing.desconto_semestral_pct}% · Anual{" "}
              {pricing.desconto_anual_pct}% de desconto.
            </p>
          ) : null}
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold">
                Simule o seu investimento
              </h2>
              <p className="mt-2 text-muted-foreground text-sm">
                Escolha quantos módulos você precisa, o número de colaboradores
                e o ciclo de pagamento.
              </p>
            </div>
            <PricingSimulator />
          </div>
        </div>
      </section>

      <section className="py-14 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Faixas por porte</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              O valor por colaborador é o mesmo em qualquer porte. As faixas
              existem para organizar o atendimento e a implantação.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {(pricing?.faixas ?? []).map((f) => (
              <Card key={f.slug} className="rounded-2xl h-full">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold">{f.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {f.sob_consulta
                      ? `${f.min}+ colaboradores ou demandas especiais`
                      : `${f.min} a ${f.max} colaboradores`}
                  </p>
                  {f.sob_consulta ? (
                    <>
                      <p className="text-sm font-semibold text-primary">
                        Sob consulta
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Projetos de consultoria sob medida com o RH Service.
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <a href={`mailto:${CONTACT_EMAIL}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Falar com especialista
                        </a>
                      </Button>
                    </>
                  ) : (
                    pricing && (
                      <>
                        <p className="text-sm font-semibold text-primary">
                          {formatBRL(pricing.preco_base_colaborador)} por
                          colaborador/mês no 1º módulo
                        </p>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                          <li className="flex gap-2">
                            <Check className="h-3.5 w-3.5 text-[#16A34A] mt-0.5 shrink-0" />
                            2º módulo em diante:{" "}
                            {pricing.desconto_modulo_adicional_pct}% off
                          </li>
                          <li className="flex gap-2">
                            <Check className="h-3.5 w-3.5 text-[#16A34A] mt-0.5 shrink-0" />
                            Semestral {pricing.desconto_semestral_pct}% · Anual{" "}
                            {pricing.desconto_anual_pct}%
                          </li>
                          <li className="flex gap-2">
                            <Check className="h-3.5 w-3.5 text-[#16A34A] mt-0.5 shrink-0" />
                            Todos os módulos disponíveis
                          </li>
                        </ul>
                      </>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-3xl mx-auto mt-10 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">NR-1:</strong> segue a mesma
              regra dos demais módulos e conta como 1º módulo para o desconto dos
              adicionais.
            </p>
            <p>
              A contratação é feita dentro da plataforma, após o acesso. Grandes
              contratos podem ser negociados diretamente com o nosso time
              comercial.
            </p>
          </div>

          <div className="flex justify-center mt-10">
            <DemoDialog size="lg" />
          </div>
        </div>
      </section>

      <PivotFAQSection />
    <section className="py-14 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <ImageSlot label="Imagem E" alt="Equipe de RH trabalhando com tecnologia" />
        </div>
      </section>
    </PublicLayout>
  );
};

export default Precos;
