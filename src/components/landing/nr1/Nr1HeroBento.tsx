import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Sparkles,
  BarChart3,
  ShieldCheck,
  FileSpreadsheet,
  ClipboardCheck,
  Activity,
  Users,
} from 'lucide-react';

interface Props {
  onDiagnostico: () => void;
}


/**
 * Hero compacto + Bento grid das features NR-1.
 * Substitui o hero alto anterior, dando ênfase imediata ao que a CompSmart
 * cobre da norma NR-1. Paleta: Navy #1E2761 / Emerald #22C55E / Sand #F5F0EB / Coral #E8634A.
 */
export default function Nr1HeroBento({ onDiagnostico }: Props) {
  return (
    <section className="bg-[#F5F0EB] text-[#1E2761]">
      <div className="container mx-auto px-4 pt-6 pb-10 sm:pt-8 sm:pb-12 md:pt-12 md:pb-16">
        {/* Hero compacto */}
        <header className="max-w-4xl mx-auto text-center mb-8 md:mb-10 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#22C55E] text-white rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 md:mb-5">
            <Sparkles className="h-3 w-3" />
            <span>NR-1 Inteligente · 1ª do Brasil</span>
          </div>
          <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl leading-[1.15] md:leading-tight mb-3 md:mb-4">
            NR-1 fez todo mundo mapear.{' '}
            <span className="text-[#22C55E]">Só a CompSmart te diz o que fazer.</span>
          </h1>
          <p className="text-base md:text-lg text-[#1E2761]/70 mb-5 md:mb-6 max-w-xl sm:max-w-2xl mx-auto">
            Transformamos obrigação legal em inteligência preditiva que cuida do bem-estar
            e retém talentos reais — antes que o pedido de demissão chegue.
          </p>
          <div className="flex justify-center px-4 sm:px-0">
            <Button
              size="lg"
              onClick={onDiagnostico}
              className="w-full sm:w-auto bg-[#22C55E] hover:bg-[#22C55E]/90 text-white rounded-2xl font-bold shadow-xl shadow-[#22C55E]/20 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base"
            >
              Diagnóstico grátis em 2 min <ArrowRight className="h-4 w-4 ml-1.5 shrink-0" />
            </Button>
          </div>
        </header>

        {/* Bento das features NR-1 */}
        <div id="funcionalidades" className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 1. Mapa de Risco — destaque grande */}
            <div className="md:col-span-2 md:row-span-2 bg-white p-7 md:p-8 rounded-[2rem] border border-[#1E2761]/5 shadow-sm flex flex-col justify-between hover:border-[#22C55E]/30 transition-colors">
              <div>
                <div className="w-12 h-12 bg-[#22C55E]/10 rounded-2xl flex items-center justify-center mb-5">
                  <BarChart3 className="w-6 h-6 text-[#22C55E]" />
                </div>
                <h3 className="font-bold text-xl md:text-2xl mb-2">
                  Mapa de Risco Psicossocial
                </h3>
                <p className="text-[#1E2761]/60 mb-5 text-sm md:text-base">
                  Aplicação automatizada do <strong>COPSOQ-III</strong> com 6 dimensões e mais
                  de 13 fatores críticos mapeados — gerando o relatório oficial exigido pela
                  Portaria MTE 1.419/2024.
                </p>
              </div>
              <div className="bg-[#F5F0EB] rounded-2xl p-4">
                <div className="flex gap-1 mb-2">
                  <div className="h-2 flex-1 bg-[#22C55E] rounded-full" />
                  <div className="h-2 flex-1 bg-[#22C55E] rounded-full" />
                  <div className="h-2 flex-1 bg-[#E8634A] rounded-full" />
                  <div className="h-2 flex-1 bg-gray-200 rounded-full" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E2761]/50">
                  Status · 13 dimensões ativas
                </span>
              </div>
            </div>

            {/* 2. Plano de ação — faixa larga */}
            <div className="md:col-span-2 bg-[#1E2761] p-7 rounded-[2rem] text-white flex items-center justify-between gap-4 overflow-hidden relative">
              <div className="relative z-10 flex-1">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                  <ClipboardCheck className="w-5 h-5 text-[#22C55E]" />
                </div>
                <h3 className="font-bold text-lg md:text-xl mb-1">
                  Plano de Ação NR-1 & PGR
                </h3>
                <p className="text-white/70 text-sm">
                  Geração automática de cronograma, responsáveis e priorização de riscos —
                  integrado ao PGR.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[#22C55E] rounded-full blur-3xl opacity-25" />
              <div className="relative z-10 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-md text-center shrink-0">
                <div className="text-[10px] font-bold tracking-widest opacity-80">PROCESSO</div>
                <div className="text-2xl font-bold text-[#22C55E]">92%</div>
              </div>
            </div>

            {/* 3. Importação externa */}
            <div className="bg-white p-6 rounded-[2rem] border border-[#1E2761]/5 shadow-sm hover:border-[#22C55E]/30 transition-colors">
              <div className="w-10 h-10 bg-[#E8634A]/10 rounded-xl flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5 text-[#E8634A]" />
              </div>
              <h4 className="font-bold text-sm md:text-base mb-1">Importação de Matriz</h4>
              <p className="text-[12px] text-[#1E2761]/60 leading-relaxed">
                Aceita matrizes <strong>HSE</strong>, <strong>JCQ</strong>, <strong>ERI</strong> e
                planilhas livres. Templates de mapeamento reutilizáveis.
              </p>
            </div>

            {/* 4. Anonimato LGPD */}
            <div className="bg-[#22C55E] p-6 rounded-[2rem] text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-sm md:text-base mb-1">Anonimato LGPD</h4>
              <p className="text-[12px] text-white/85 leading-relaxed">
                Respostas com <strong>k-anonymity</strong>. O colaborador responde sem medo —
                o relatório é por grupo, nunca por pessoa.
              </p>
            </div>

            {/* 5. Painel executivo / Vitalidade */}
            <div className="bg-white p-6 rounded-[2rem] border border-[#1E2761]/5 shadow-sm flex flex-col justify-between hover:border-[#22C55E]/30 transition-colors">
              <div>
                <div className="w-10 h-10 bg-[#1E2761]/10 rounded-xl flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-[#1E2761]" />
                </div>
                <h4 className="font-bold text-sm md:text-base mb-1">Painel de Vitalidade</h4>
                <p className="text-[12px] text-[#1E2761]/60 leading-relaxed">
                  Indicador único de saúde organizacional para a diretoria. Tendência mensal e
                  alertas por área.
                </p>
              </div>
              <div className="flex items-end gap-1 mt-3">
                {[40, 55, 48, 62, 70, 78].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#22C55E]/70 rounded-sm"
                    style={{ height: `${h * 0.35}px` }}
                  />
                ))}
              </div>
            </div>

            {/* 6. Sociodemográfico & Segurança Psicológica */}
            <div className="bg-white p-6 rounded-[2rem] border border-[#1E2761]/5 shadow-sm hover:border-[#22C55E]/30 transition-colors">
              <div className="w-10 h-10 bg-[#22C55E]/10 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-[#22C55E]" />
              </div>
              <h4 className="font-bold text-sm md:text-base mb-1">
                Sociodemográfico & Segurança Psicológica
              </h4>
              <p className="text-[12px] text-[#1E2761]/60 leading-relaxed">
                Recortes por gênero, faixa etária, tempo de casa — para identificar grupos
                vulneráveis sem expor indivíduos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
