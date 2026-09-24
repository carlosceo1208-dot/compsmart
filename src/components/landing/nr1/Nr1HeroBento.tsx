import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  ClipboardCheck,
  Users,
} from 'lucide-react';
import imagemReuniao from '@/assets/imagem-a-reuniao.png.asset.json';
import imagemMapa from '@/assets/nr1-mapa.png.asset.json';
import imagemBemEstar from '@/assets/nr1-bem-estar.png.asset.json';

interface Props {
  onDiagnostico: () => void;
}


/**
 * Hero compacto + Bento grid das features NR-1.
 * Substitui o hero alto anterior, dando ênfase imediata ao que a CompSmart
 * cobre da norma NR-1. Usa os tokens visuais da CompSmart.
 */
export default function Nr1HeroBento({ onDiagnostico }: Props) {
  return (
    <section className="bg-primary/5 text-foreground">
      <div className="container mx-auto px-4 pt-6 pb-10 sm:pt-8 sm:pb-12 md:pt-12 md:pb-16">
        {/* Hero compacto */}
        <header className="grid items-center gap-7 lg:grid-cols-[1.2fr_1fr] max-w-6xl mx-auto mb-8 md:mb-10 lg:mb-12">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 md:mb-5">
              <Sparkles className="h-3 w-3" />
              <span>NR-1 Inteligente · CompSmart</span>
            </div>
            <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl leading-[1.15] md:leading-tight mb-3 md:mb-4">
              Gestão de riscos psicossociais.{' '}
              <span className="text-primary">Só a CompSmart te diz o que fazer.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-5 md:mb-6 max-w-xl sm:max-w-2xl mx-auto lg:mx-0">
              Organize o diagnóstico, acompanhe riscos por grupo e planeje ações com sua equipe de RH e SST.
            </p>
            <div className="flex justify-center px-4 sm:px-0 lg:justify-start">
              <Button
                size="lg"
                onClick={onDiagnostico}
                className="w-full sm:w-auto rounded-lg font-bold h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base"
              >
                Diagnóstico grátis em 2 min <ArrowRight className="h-4 w-4 ml-1.5 shrink-0" />
              </Button>
            </div>
          </div>
          <img
            src={imagemReuniao.url}
            alt="Reunião consultiva sobre gestão de riscos psicossociais"
            className="aspect-video w-full rounded-2xl object-cover shadow-md"
          />
        </header>

        {/* Bento das features NR-1 */}
        <div id="funcionalidades" className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 1. Mapa de Risco — destaque grande */}
            <div className="md:col-span-2 md:row-span-2 bg-card p-7 md:p-8 rounded-[2rem] border border-border shadow-sm flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-bold text-xl md:text-2xl mb-2">
                  Mapa de Risco Psicossocial
                </h2>
                <p className="text-muted-foreground mb-5 text-sm md:text-base">
                  Aplicação automatizada do <strong>COPSOQ-III</strong> com 6 dimensões e mais
                  de 13 fatores críticos mapeados — apoiando a documentação e o plano de ação da empresa.
                </p>
              </div>
              <figure className="overflow-hidden rounded-2xl bg-primary/5 shadow-sm">
                <img src={imagemMapa.url} alt="Profissionais analisando um mapa de risco em um tablet" className="aspect-video w-full object-cover" />
                <figcaption className="p-3 text-[10px] font-bold uppercase text-muted-foreground">
                  Visualização ilustrativa do mapa de risco — matriz COPSOQ-III por área.
                </figcaption>
              </figure>
            </div>

            {/* 2. Plano de ação — faixa larga */}
            <div className="md:col-span-2 bg-primary p-7 rounded-[2rem] text-primary-foreground flex items-center justify-between gap-4 overflow-hidden relative">
              <div className="relative z-10 flex-1">
                <div className="w-10 h-10 bg-primary-foreground/10 rounded-xl flex items-center justify-center mb-3">
                  <ClipboardCheck className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="font-bold text-lg md:text-xl mb-1">
                  Plano de Ação NR-1 & PGR
                </h2>
                <p className="text-primary-foreground/70 text-sm">
                  Geração automática de cronograma, responsáveis e priorização de riscos —
                  integrado ao PGR.
                </p>
              </div>
              <div className="relative z-10 bg-primary-foreground/10 px-4 py-3 rounded-xl backdrop-blur-md text-center shrink-0">
                <div className="text-xs font-bold">Plano de ação</div>
              </div>
            </div>

            {/* 3. Importação externa */}
            <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5 text-warning" />
              </div>
              <h4 className="font-bold text-sm md:text-base mb-1">Importação de Matriz</h4>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Aceita matrizes <strong>HSE</strong>, <strong>JCQ</strong>, <strong>ERI</strong> e
                planilhas livres. Templates de mapeamento reutilizáveis.
              </p>
            </div>

            {/* 4. Anonimato LGPD */}
            <div className="bg-primary p-6 rounded-[2rem] text-primary-foreground">
              <img src={imagemBemEstar.url} alt="Roda de conversa sobre bem-estar" className="mb-4 h-40 w-full rounded-2xl object-cover shadow-sm" />
              <h4 className="font-bold text-sm md:text-base mb-1">Anonimato LGPD</h4>
              <p className="text-[12px] text-primary-foreground/85 leading-relaxed">
                Respostas com <strong>k-anonymity</strong>. O colaborador responde sem medo —
                o relatório é por grupo, nunca por pessoa.
              </p>
            </div>

            {/* 5. Painel executivo / Vitalidade */}
            <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div>
                <img src={imagemBemEstar.url} alt="Roda de conversa sobre vitalidade" className="mb-4 h-40 w-full rounded-2xl object-cover shadow-sm" />
                <h4 className="font-bold text-sm md:text-base mb-1">Painel de Vitalidade</h4>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Indicador único de saúde organizacional para a diretoria. Tendência mensal e
                  alertas por área.
                </p>
              </div>
            </div>

            {/* 6. Sociodemográfico & Segurança Psicológica */}
            <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-bold text-sm md:text-base mb-1">
                Sociodemográfico & Segurança Psicológica
              </h4>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
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
