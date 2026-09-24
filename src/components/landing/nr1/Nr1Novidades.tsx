import { Sparkles, MessageSquareHeart, Smile, Network, Stethoscope } from 'lucide-react';
import imagemBemEstar from '@/assets/nr1-bem-estar.png.asset.json';

const NOVIDADES = [
  {
    n: '01',
    icon: MessageSquareHeart,
    tag: 'Cultura',
    title: 'Pesquisa de Clima Organizacional',
    desc:
      'Pesquisa estruturada de clima com 10 dimensões (liderança, comunicação, reconhecimento, equilíbrio, propósito…) totalmente integrada ao Mapa de Risco NR-1.',
    exemplo:
      'Exemplo ilustrativo: a área Comercial apresenta risco elevado; a pesquisa de Clima ajuda o RH a investigar possíveis fatores de liderança.',
  },
  {
    n: '02',
    icon: Smile,
    tag: 'Bem-estar',
    title: 'Índice de Felicidade — FIB',
    desc:
      'Felicidade Interna Bruta aplicada ao ambiente corporativo. Mede 9 pilares (saúde, equilíbrio, vitalidade emocional, conexões, propósito, autonomia, segurança, crescimento e reconhecimento) e gera um índice 0–100 por área.',
    exemplo:
      'Exemplo ilustrativo: uma queda agregada no índice de equilíbrio vida-trabalho orienta o acompanhamento pelo RH.',
  },
  {
    n: '03',
    icon: Network,
    tag: 'Exclusivo',
    title: 'Cruzamento dos Riscos Psicossociais',
    desc:
      'Com módulos complementares contratados, a CompSmart combina indicadores agregados de NR-1, Clima, 9-Box e Remuneração para orientar decisões sem revelar respostas individuais.',
    exemplo:
      'Exemplo ilustrativo: uma área com pressão psicossocial elevada e clima em queda pode receber atenção prioritária do RH.',
  },
  {
    n: '04',
    icon: Stethoscope,
    tag: 'Individual',
    title: 'Check-Up do Colaborador',
    desc:
      'Autoavaliação periódica e voluntária de saúde mental e física. O colaborador responde um pulso curto (sono, energia, ansiedade, dores, satisfação) e recebe orientação. A empresa enxerga apenas agregados anônimos por grupo.',
    exemplo:
      'Exemplo ilustrativo: sinais agregados de sono e energia ajudam a equipe de SST a planejar ações preventivas.',
  },
];

export default function Nr1Novidades() {
  return (
    <section id="novidades" className="bg-primary/5 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-widest mb-3">
                <Sparkles className="h-3 w-3" /> Novidades
              </div>
              <h2 className="font-bold text-2xl md:text-3xl text-foreground leading-tight">
                Vá além do mapa de risco.{' '}
                <span className="text-primary">Aprofunde os resultados da NR-1.</span>
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Recursos e cruzamentos opcionais que ajudam o RH a transformar o diagnóstico NR-1 em ações contínuas. Clima e 9-Box são módulos contratados à parte.
              </p>
            </div>
          </div>

          {/* Cards */}
          <div className="bg-card rounded-lg border border-border p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {NOVIDADES.map((nv) => {
                const Icon = nv.icon;
                return (
                  <div
                    key={nv.n}
                    className="group rounded-lg border border-border p-6 hover:border-primary/40 hover:shadow-md transition-all bg-background"
                  >
                    {nv.title === 'Check-Up do Colaborador' && (
                      <img
                        src={imagemBemEstar.url}
                        alt="Roda de conversa sobre o bem-estar dos colaboradores"
                        className="mb-5 aspect-video w-full rounded-2xl object-cover shadow-sm"
                      />
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                          {nv.tag}
                        </span>
                        <span className="text-primary font-bold text-lg">{nv.n}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2 leading-snug">
                      {nv.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {nv.desc}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-card rounded-lg p-3 border border-border">
                      <strong className="text-foreground">{nv.exemplo.split(':')[0]}:</strong>
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
