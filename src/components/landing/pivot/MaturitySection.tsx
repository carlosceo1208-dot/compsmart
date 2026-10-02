import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass } from "lucide-react";

const NIVEIS = [1, 2, 3, 4, 5];

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

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm" aria-hidden="true">
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            <span>Controle</span><span>Estilo de gestão</span><span>Facilitação</span>
          </div>
          <div className="space-y-2">
            {[...NIVEIS].reverse().map((n, i) => (
              <div key={n} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">Nível {n}</span>
                <div className="h-6 flex-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(5 - i) * 20}%`, opacity: 0.35 + (5 - i) * 0.13 }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-center">
            Maturidade estrutural
          </p>
        </div>
      </div>
    </div>
  </section>
);
