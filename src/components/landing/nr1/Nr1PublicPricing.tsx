import { Check, Mail, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PricingSimulator } from "@/components/landing/pivot/PricingSimulator";
import { CONTACT_EMAIL } from "@/config/landingModules";
import { formatBRL, usePublicPricing } from "@/hooks/usePublicPricing";

const NR1_FEATURES = [
  "Visão Geral",
  "Universo",
  "Matriz de Risco",
  "Importação de Mapa de Risco",
  "Segurança Psicológica",
  "Sociodemográfico",
  "Etapas",
  "Novo Diagnóstico",
  "Histórico",
  "Plano de Ação",
  "Gestão de Terceiros",
  "Vitalidade",
  "Inteligência",
];

export function Nr1PublicPricing() {
  const { data: pricing, isLoading } = usePublicPricing();

  return (
    <section id="planos" className="py-14 bg-background">
      <div className="container mx-auto px-4 space-y-12">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">
            NR-1 a partir de R$ 5,00 por colaborador/mês
          </h2>
          <p className="text-muted-foreground">
            Mesma regra dos demais módulos: R$ 5,00 por colaborador/mês no 1º módulo e R$ 2,50 nos módulos adicionais (50% de desconto). Semestral 5% · Anual 10% de desconto.
          </p>
        </div>

        <Card className="max-w-5xl mx-auto border-primary/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">O que você recebe</CardTitle>
            <p className="text-sm text-muted-foreground">
              Os 13 módulos internos do NR-1 são idênticos em todas as faixas.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {NR1_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 rounded-md border border-border bg-card p-3 text-sm font-medium">
                  <Check className="h-4 w-4 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold">Faixas por porte</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              O valor por colaborador é o mesmo em qualquer porte. As faixas organizam o atendimento e a implantação.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {(pricing?.faixas ?? []).map((faixa) => (
              <Card key={faixa.slug} className="h-full border-primary/25">
                <CardContent className="p-6 space-y-3">
                  <h4 className="font-semibold">{faixa.nome}</h4>
                  <p className="text-sm text-muted-foreground">
                    {faixa.sob_consulta
                      ? `${faixa.min.toLocaleString("pt-BR")}+ colaboradores ou demandas especiais`
                      : `${faixa.min.toLocaleString("pt-BR")} a ${faixa.max?.toLocaleString("pt-BR")} colaboradores`}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {faixa.sob_consulta || !pricing
                      ? "Sob consulta"
                      : `${formatBRL(pricing.preco_base_colaborador)}/colab/mês no 1º módulo`}
                  </p>
                  {faixa.sob_consulta && (
                    <Button asChild variant="outline" size="sm">
                      <a href={`mailto:${CONTACT_EMAIL}`}>
                        <Mail className="h-4 w-4" />
                        Falar com especialista
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {!pricing && (
            <p className="text-center text-sm text-muted-foreground">
              {isLoading ? "Carregando faixas…" : "Preços temporariamente indisponíveis."}
            </p>
          )}
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold">Simule o seu investimento</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha o número de colaboradores, os módulos contratados e o ciclo de pagamento.
            </p>
          </div>
          <PricingSimulator />
          <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            NR-1 conta como 1º módulo para o desconto dos adicionais. A contratação é feita dentro da plataforma, após o acesso. Grandes contratos podem ser negociados diretamente com o time comercial.
          </div>
        </div>
      </div>
    </section>
  );
}