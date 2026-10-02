import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass } from "lucide-react";
import { ESTILOS_GESTAO, NIVEIS_ESTRUTURAIS } from "@/lib/maturidade";

/**
 * Apresenta o modelo de maturidade sem prometer funcionalidades que a página
 * /maturidade ainda não entrega (o cruzamento com dados da plataforma é etapa futura).
 */
export const MaturitySection = () => (
  <section id="maturidade" className="py-16 md:py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Compass className="h-3.5 w-3.5" /> Maturidade da Gestão de Pessoas
          </span>
          <h2 className="text-2xl md:text-4xl font-bold">
            Descubra o nível de maturidade da sua gestão de pessoas.
          </h2>
          <p className="text-muted-foreground">
            O modelo combina 5 níveis e 2 eixos: a maturidade estrutural das
            práticas de RH e o estilo de gestão, do controle à facilitação. A
            leitura junta a visão do RH e das lideranças para mostrar por onde
            começar.
          </p>
          <Button asChild size="lg" id="cta-maturidade">
            <Link to="/maturidade">
              Descobrir meu nível <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Nossos consultores usam este diagnóstico para abrir a conversa e
            desenhar o plano.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Maturidade estrutural</p>
              <ol className="space-y-2">
                {NIVEIS_ESTRUTURAIS.map((nivel) => (
                  <li key={nivel.n} className="flex items-center gap-2 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{nivel.n}</span>
                    <span className="font-medium">{nivel.nome}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Estilo de gestão</p>
              <ol className="space-y-2">
                {ESTILOS_GESTAO.map((estilo) => (
                  <li key={estilo.n} className="flex items-center gap-2 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{estilo.n}</span>
                    <span className="font-medium">{estilo.nome}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            O diagnóstico gratuito apresenta o nível de maturidade estrutural.
            O estilo de gestão integra o modelo completo conduzido com nossos consultores.
          </p>
        </div>
      </div>
    </div>
  </section>
);
