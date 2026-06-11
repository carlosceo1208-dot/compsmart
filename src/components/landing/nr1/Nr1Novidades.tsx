import { Sparkles, MessageSquareHeart, Smile, Network, Stethoscope } from 'lucide-react';

const NOVIDADES = [
  {
    n: '01',
    icon: MessageSquareHeart,
    tag: 'Cultura',
    title: 'Pesquisa de Clima Organizacional',
    desc:
      'Pesquisa estruturada de clima com 10 dimensões (liderança, comunicação, reconhecimento, equilíbrio, propósito…) totalmente integrada ao Mapa de Risco NR-1.',
    exemplo:
      'Ex.: a área Comercial aparece com risco psicossocial alto em "exigências emocionais" — o módulo de Clima revela que a causa raiz está em "feedback da liderança" abaixo da média.',
  },
  {
    n: '02',
    icon: Smile,
    tag: 'Bem-estar',
    title: 'Índice de Felicidade — FIB',
    desc:
      'Felicidade Interna Bruta aplicada ao ambiente corporativo. Mede 9 pilares (saúde, equilíbrio, vitalidade emocional, conexões, propósito, autonomia, segurança, crescimento e reconhecimento) e gera um índice 0–100 por área.',
    exemplo:
      'Ex.: FIB de Engenharia caiu 12 pontos no trimestre, puxado por "equilíbrio vida-trabalho" — gatilho automático para o RH agir antes do burnout.',
  },
  {
    n: '03',
    icon: Network,
    tag: 'Exclusivo',
    title: 'Cruzamento dos Riscos Psicossociais',
    desc:
      'A CompSmart cruza o risco psicossocial NR-1 com 9Box, avaliação de desempenho, faixa salarial e tempo de casa. Identifica o cenário mais perigoso: top talent em burnout com salário defasado.',
    exemplo:
      'Ex.: 12 colaboradores classificados "Top Talent" no 9Box estão em zona de risco alto e com salário ‑12% vs. mercado — probabilidade de pedido de demissão em 90 dias: 73%.',
  },
  {
    n: '04',
    icon: Stethoscope,
    tag: 'Individual',
    title: 'Check-Up do Colaborador',
    desc:
      'Autoavaliação periódica e voluntária de saúde mental e física. O colaborador responde um pulso curto (sono, energia, ansiedade, dores, satisfação) e recebe orientação. A empresa enxerga apenas agregados anônimos por grupo.',
    exemplo:
      'Ex.: 38% dos respondentes da fábrica relatam sono ruim há 4 semanas seguidas — alerta automático para SST e ações de mitigação no PGR.',
  },
];

export default function Nr1Novidades() {
  return (
    <section id="novidades" className="bg-[#F5F0EB] py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E8634A] text-white text-[10px] font-bold rounded-full uppercase tracking-widest mb-3">
                <Sparkles className="h-3 w-3" /> Novidades
              </div>
              <h2 className="font-bold text-2xl md:text-3xl text-[#1E2761] leading-tight">
                Vá além do mapa de risco.{' '}
                <span className="text-[#22C55E]">Aprofunde os resultados da NR-1.</span>
              </h2>
              <p className="text-[#1E2761]/60 mt-2 max-w-2xl">
                Quatro módulos exclusivos que transformam o diagnóstico NR-1 em ação contínua
                de bem-estar, retenção e cultura.
              </p>
            </div>
          </div>

          {/* Cards */}
          <div className="bg-white rounded-[2.5rem] border border-[#1E2761]/10 p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {NOVIDADES.map((nv) => {
                const Icon = nv.icon;
                return (
                  <div
                    key={nv.n}
                    className="group rounded-2xl border border-[#1E2761]/5 p-6 hover:border-[#22C55E]/40 hover:shadow-md transition-all bg-[#F5F0EB]/40"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 bg-[#22C55E]/10 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#22C55E]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8634A]">
                          {nv.tag}
                        </span>
                        <span className="text-[#E8634A] font-bold text-lg">{nv.n}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-[#1E2761] mb-2 leading-snug">
                      {nv.title}
                    </h3>
                    <p className="text-sm text-[#1E2761]/70 leading-relaxed mb-3">
                      {nv.desc}
                    </p>
                    <p className="text-xs text-[#1E2761]/60 leading-relaxed bg-white rounded-lg p-3 border border-[#1E2761]/5">
                      <strong className="text-[#1E2761]">{nv.exemplo.split(':')[0]}:</strong>
                      {nv.exemplo.split(':').slice(1).join(':')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
