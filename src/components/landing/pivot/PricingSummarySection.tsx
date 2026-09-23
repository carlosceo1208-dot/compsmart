import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";
import {
  usePublicPricing,
  additionalModulePrice,
  formatBRL,
} from "@/hooks/usePublicPricing";

export const PricingSummarySection = () => {
  const { data: pricing } = usePublicPricing();
  if (!pricing) return null;

  const itens = [
    `A partir de ${formatBRL(pricing.preco_base_colaborador)} por colaborador/mês por módulo`,
    `Do 2º módulo em diante: ${pricing.desconto_modulo_adicional_pct}% off (${formatBRL(additionalModulePrice(pricing))} por colaborador/mês)`,
    `Semestral ${pricing.desconto_semestral_pct}% · Anual ${pricing.desconto_anual_pct}% de desconto`,
  ];

  return (
    <section id="precos" className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-bold">
            Preço simples, por colaborador
          </h2>
          <p className="mt-3 text-muted-foreground">
            Você paga por módulo contratado e por colaborador ativo. Sem
            implantação obrigatória, sem pacote fechado.
          </p>
        </div>

        <Card className="max-w-3xl mx-auto rounded-2xl">
          <CardContent className="p-6 md:p-8 space-y-4">
            <ul className="space-y-3">
              {itens.map((i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-[#16A34A] mt-0.5 shrink-0" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              {pricing.faixas.map((f) => (
                <span
                  key={f.slug}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {f.nome}
                  {f.sob_consulta
                    ? " · sob consulta"
                    : ` · ${f.min}${f.max ? `–${f.max}` : "+"} colaboradores`}
                </span>
              ))}
            </div>
            <Button asChild className="mt-2">
              <Link to="/precos">
                Ver preços e simular
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
