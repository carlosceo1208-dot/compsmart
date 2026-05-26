import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Clock, Sparkles } from 'lucide-react';

/**
 * Destaque NR-1 logo abaixo do Hero — chamada principal para a landing dedicada (/nr1).
 * Aproveita a urgência regulatória (maio/2026) e a diferenciação única da plataforma.
 */
export const Nr1HighlightBanner = () => {
  return (
    <section className="relative w-full pt-36 md:pt-40 pb-12 overflow-hidden bg-gradient-to-r from-[hsl(217,91%,15%)] via-[hsl(217,91%,22%)] to-[hsl(217,91%,15%)]">
      {/* Glow animado de fundo */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-emerald-500/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Faixa pulsante topo */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-6xl mx-auto rounded-2xl bg-white/10 backdrop-blur-md border-2 border-emerald-400/40 p-6 md:p-8 shadow-2xl shadow-emerald-500/20 flex flex-col md:flex-row items-center gap-6 hover:border-emerald-400/70 transition-all">
          {/* Ícone animado */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-emerald-400 blur-xl opacity-60 animate-pulse" />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left text-white">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <Clock className="h-3 w-3" />
              Novo · Fiscalização inicia em maio/2026
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-tight">
              NR-1 Inteligente:{' '}
              <span className="bg-gradient-to-r from-emerald-300 to-emerald-100 bg-clip-text text-transparent">
                cumpra a lei e retenha seus talentos.
              </span>
            </h2>
            <p className="text-white/90 text-sm md:text-base leading-relaxed">
              A <strong className="text-emerald-300">única plataforma do Brasil</strong> que cruza{' '}
              <strong className="text-white">riscos psicossociais</strong> com{' '}
              <strong className="text-white">Avaliação de Desempenho</strong>,{' '}
              <strong className="text-white">9Box</strong>,{' '}
              <strong className="text-white">Pesquisa de Clima</strong> e{' '}
              <strong className="text-white">Remuneração</strong>.
              <br className="hidden md:block" />
              <span className="text-emerald-200">Diagnóstico grátis em 2 minutos.</span>
            </p>
          </div>

          <Link
            to="/nr1"
            className="group flex-shrink-0 inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-[hsl(217,91%,15%)] font-bold text-base transition-all shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-400/60 hover:scale-105"
          >
            <Sparkles className="h-5 w-5" />
            Conhecer NR-1
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};
