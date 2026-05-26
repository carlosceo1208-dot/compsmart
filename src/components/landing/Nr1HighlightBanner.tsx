import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Clock } from 'lucide-react';

/**
 * Destaque NR-1 na home — chama o lead para a landing dedicada (/nr1).
 * Aproveita a urgência regulatória (maio/2026) para gerar cliques qualificados.
 */
export const Nr1HighlightBanner = () => {
  return (
    <section className="w-full py-10 bg-gradient-to-r from-[hsl(217,91%,18%)] via-[hsl(217,91%,24%)] to-[hsl(217,91%,18%)]">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto rounded-2xl bg-white/5 backdrop-blur border border-white/15 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>

          <div className="flex-1 text-center md:text-left text-white">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
              <Clock className="h-3.5 w-3.5" />
              Novo · Fiscalização inicia em maio/2026
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
              NR-1 Inteligente: cumpra a lei e retenha seus talentos.
            </h2>
            <p className="text-white/80 text-sm md:text-base">
              A única plataforma do Brasil que cruza riscos psicossociais com 9Box e remuneração.
              Diagnóstico grátis em 2 minutos.
            </p>
          </div>

          <Link
            to="/nr1"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-all shadow-lg hover:shadow-emerald-500/40 hover:scale-105"
          >
            Conhecer NR-1
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
