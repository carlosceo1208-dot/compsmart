import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Brain, FileText, ListChecks, ArrowLeft, Sparkles, Grid3x3, Shield, Users, GitBranch, UserCheck, ShieldAlert, ClipboardCheck, HeartPulse, Library, Heart, CalendarCheck, ClipboardList, BarChart3, LayoutGrid, DollarSign, Building2, Upload, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Nr1ConsentGate } from '@/components/nr1/Nr1ConsentGate';
import { Nr1BemEstarFloating } from '@/components/nr1/Nr1BemEstarFloating';
import { Nr1TerceirosDialog } from '@/components/nr1/terceiros/Nr1TerceirosDialog';
import { Nr1ImportarMatrizDialog } from '@/components/nr1/Nr1ImportarMatrizDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import manualNr1Asset from '@/assets/manual-nr1-compsmart.pdf.asset.json';

type NavItem = { to?: string; label: string; icon: any; end?: boolean; highlight?: boolean; onClick?: () => void; action?: 'open-terceiros' | 'open-import-matriz'; desc?: string; actions?: string[]; shortcut?: { to: string; icon: any; label: string }; resource?: { url: string; icon: any; label: string } };
type NavGroup = { title: string; tone: 'nr1' | 'clima' | 'cruzamento' | 'fib' | 'jornada' | 'glossario'; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: 'NR-1',
    tone: 'nr1',
    items: [
      { to: '/nr1/painel', label: 'Visão Geral', icon: Activity, end: true, desc: 'Painel executivo com KPIs, score psicossocial e status de conformidade NR-1.', actions: ['Ver KPIs e score psicossocial', 'Acompanhar conformidade NR-1', 'Atalho rápido: Plano de Ação'], shortcut: { to: '/nr1/planos-acao', icon: ClipboardCheck, label: 'Ir para Plano de Ação' } },
      { to: '/nr1/universo', label: 'Universo', icon: UserCheck, desc: 'Defina o universo elegível para diagnóstico (colaboradores ativos por unidade, área e cargo).', actions: ['Filtrar por unidade/área/cargo', 'Validar elegíveis', 'Exportar lista'] },
      { to: '/nr1/fib', label: 'Matriz de Risco', icon: Grid3x3, desc: 'Matriz 5x5 de probabilidade × severidade dos riscos psicossociais identificados.', actions: ['Visualizar matriz 5x5', 'Classificar riscos', 'Gerar plano a partir do risco'] },
      { to: '/nr1/seguranca-psicologica', label: 'Segurança Psicológica', icon: Shield, desc: 'Mede confiança, abertura para erros e voz ativa nas equipes.', actions: ['Ver score por equipe', 'Comparar áreas', 'Recomendações de IA'] },
      { to: '/nr1/sociodemografico', label: 'Sociodemográfico', icon: Users, desc: 'Recortes por gênero, faixa etária, raça/cor e PCD para análise de equidade.', actions: ['Filtrar recortes', 'Comparar grupos', 'Exportar relatório'] },
      { to: '/nr1/etapas', label: 'Etapas', icon: GitBranch, desc: 'Roteiro guiado: PGR, diagnóstico, plano de ação e governança NR-1.', actions: ['Avançar etapas do PGR', 'Marcar conclusão', 'Anexar evidências'] },
      { to: '/nr1/diagnostico/novo', label: 'Novo Diagnóstico', icon: FileText, desc: 'Iniciar novo ciclo COPSOQ-III com convites anônimos aos colaboradores.', actions: ['Criar ciclo', 'Enviar convites anônimos', 'Configurar prazo'] },
      { to: '/nr1/diagnosticos', label: 'Histórico', icon: ListChecks, desc: 'Histórico de ciclos concluídos, evolução de score e comparativo entre períodos.', actions: ['Ver ciclos anteriores', 'Comparar períodos', 'Exportar relatórios'] },
      { to: '/nr1/planos-acao', label: 'Plano de Ação', icon: ClipboardCheck, desc: 'Ações corretivas e preventivas com responsáveis, prazos, evidências e aprovação.', actions: ['Criar nova ação', 'Aprovar / rejeitar / solicitar revisão', 'Acompanhar prazos e progresso'] },
      { label: 'Gestão de Terceiros', icon: Building2, action: 'open-terceiros', desc: 'Cadastro e monitoramento de fornecedores quanto à conformidade NR-1.', actions: ['Cadastrar fornecedor', 'Avaliar conformidade', 'Exportar relatório'] },
      { label: 'Importar Matriz de Risco', icon: Upload, action: 'open-import-matriz', desc: 'Importar matriz de risco existente (planilha) para a plataforma.', actions: ['Baixar template', 'Subir planilha', 'Validar importação'] },
      { to: '/nr1/vitalidade', label: 'Vitalidade', icon: HeartPulse, desc: 'Indicadores de absenteísmo, afastamentos e saúde ocupacional.', actions: ['Ver absenteísmo', 'Afastamentos por causa', 'Tendências mensais'] },
      { to: '/nr1/inteligencia', label: 'Inteligência', icon: Sparkles, desc: 'Insights e recomendações geradas por IA com base no diagnóstico e ações.', actions: ['Gerar insights por IA', 'Recomendações priorizadas', 'Aplicar ao plano'] },
    ],
  },
  {
    title: 'Clima Organizacional',
    tone: 'clima',
    items: [
      { to: '/nr1/clima', label: 'Pesquisa de Clima 360°', icon: ClipboardList, highlight: true, desc: 'Pesquisa de clima 360° com correlação automática às dimensões NR-1.', actions: ['Criar pesquisa', 'Enviar convites', 'Ver resultados e correlação NR-1'] },
    ],
  },
  {
    title: 'Cruzamento Riscos Psicossociais',
    tone: 'cruzamento',
    items: [
      { to: '/performance/evaluations', label: 'Avaliação de Desempenho', icon: BarChart3, desc: 'Cruza performance individual com fatores de risco psicossocial.', actions: ['Ver avaliações', 'Cruzar com NR-1', 'Identificar alertas'] },
      { to: '/performance/9box', label: '9Box', icon: LayoutGrid, desc: 'Matriz 9Box (performance × potencial) correlacionada ao bem-estar.', actions: ['Posicionar talentos', 'Cruzar com bem-estar', 'Planos de sucessão'] },
      { to: '/nr1/clima', label: 'Pesquisa de Clima', icon: ClipboardList, desc: 'Resultados de clima cruzados com dimensões NR-1.', actions: ['Ver clima x NR-1', 'Filtrar por área', 'Exportar análise'] },
      { to: '/dashboard', label: 'Remuneração', icon: DollarSign, desc: 'Cruza equidade salarial e competitividade com fatores psicossociais.', actions: ['Ver equidade salarial', 'Comparar com mercado', 'Identificar gaps'] },
    ],
  },
  {
    title: 'Índice de Felicidade',
    tone: 'fib',
    items: [
      { to: '/nr1/fib-bem-estar', label: 'FIB', icon: Heart, desc: 'Felicidade Interna Bruta: medição contínua do bem-estar dos colaboradores.', actions: ['Ver FIB atual', 'Tendência histórica', 'Comparar áreas'] },
    ],
  },
  {
    title: 'Acompanhamento Colaborador',
    tone: 'jornada',
    items: [
      { to: '/nr1/jornada', label: 'Minha Jornada', icon: Heart, desc: 'Jornada pessoal de bem-estar com trilhas, conteúdos e check-ins.', actions: ['Acessar trilhas', 'Registrar check-in', 'Conteúdos recomendados'] },
      { to: '/nr1/acompanhamento', label: 'Check up Semanal', icon: CalendarCheck, desc: 'Pulse semanal de humor e energia, com alertas para gestores.', actions: ['Responder pulse', 'Ver histórico', 'Alertas para gestor'] },
    ],
  },
  {
    title: 'Glossário',
    tone: 'glossario',
    items: [
      { to: '/nr1/biblioteca', label: 'Metodologias & Biblioteca', icon: Library, desc: 'COPSOQ-III, NR-1, NBR ISO 45003 e referências metodológicas.', actions: ['Consultar metodologias', 'Baixar referências', 'Glossário NR-1'], resource: { url: manualNr1Asset.url, icon: BookOpen, label: 'Baixar Manual NR-1' } },
    ],
  },
];

const GROUP_STYLES: Record<NavGroup['tone'], { border: string; bg: string; title: string; dot: string }> = {
  nr1:       { border: 'border-[hsl(var(--nr1-primary)/0.35)]', bg: 'bg-[hsl(var(--nr1-primary)/0.04)]', title: 'text-[hsl(var(--nr1-primary))]', dot: 'bg-[hsl(var(--nr1-primary))]' },
  clima:     { border: 'border-[hsl(11_77%_60%/0.45)]',          bg: 'bg-[hsl(11_77%_60%/0.05)]',         title: 'text-[hsl(11_77%_45%)]',         dot: 'bg-[hsl(11_77%_55%)]' },
  cruzamento:{ border: 'border-violet-300',                      bg: 'bg-violet-50/60',                   title: 'text-violet-700',                dot: 'bg-violet-500' },
  fib:       { border: 'border-amber-300',                       bg: 'bg-amber-50/60',                    title: 'text-amber-700',                 dot: 'bg-amber-500' },
  jornada:   { border: 'border-sky-300',                         bg: 'bg-sky-50/60',                      title: 'text-sky-700',                   dot: 'bg-sky-500' },
  glossario: { border: 'border-slate-300',                       bg: 'bg-slate-50/70',                    title: 'text-slate-700',                 dot: 'bg-slate-500' },
};

const useIsSuperAdmin = () =>
  useQuery({
    queryKey: ['nr1-is-super-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();
      return !!data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const Nr1Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: isSuper } = useIsSuperAdmin();
  const navRef = useRef<HTMLDivElement | null>(null);
  const [terceirosOpen, setTerceirosOpen] = useState(false);
  const [importMatrizOpen, setImportMatrizOpen] = useState(false);



  return (
    <TooltipProvider delayDuration={150}>
    <div className="nr1-scope min-h-screen bg-gradient-to-b from-[hsl(var(--nr1-soft))] via-background to-background">
      {isSuper && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-xs px-4 py-1.5 flex items-center gap-2 justify-center">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>
            <strong>Modo Super Admin · CompSmart</strong> — alguns painéis podem exibir dados demonstrativos para validação interna.
            Esses dados <strong>nunca</strong> são exibidos para clientes.
          </span>
        </div>
      )}
      <header className="border-b bg-card relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: 'linear-gradient(90deg, hsl(var(--nr1-primary)) 0%, hsl(160 70% 45%) 55%, hsl(var(--nr1-accent)) 100%)' }}
          aria-hidden
        />
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center nr1-bg-gradient shadow-md">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Saúde Mental & Bem-Estar</h1>
              <p className="text-xs text-muted-foreground">Conformidade NR-1 · Riscos Psicossociais</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="hover:bg-[hsl(var(--nr1-primary)/0.08)] hover:text-[hsl(var(--nr1-primary))]">
            <NavLink to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Voltar ao CompSmart</NavLink>
          </Button>
        </div>
        <div className="container mx-auto px-4 pb-4">
          <div ref={navRef} className="grid grid-cols-12 gap-3">
            {GROUPS.map((group, idx) => {
              const styles = GROUP_STYLES[group.tone];
              // Layout spans: NR-1 = 8, Clima = 4 (top row). Demais = 4 cada (linha abaixo).
              const span =
                group.tone === 'nr1' ? 'col-span-12 lg:col-span-8'
                : group.tone === 'clima' ? 'col-span-12 lg:col-span-4'
                : group.tone === 'cruzamento' ? 'col-span-12'
                : 'col-span-12 md:col-span-6 lg:col-span-4';
              const innerCols =
                group.tone === 'nr1'
                  ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6'
                  : group.tone === 'cruzamento'
                    ? 'grid-cols-2 md:grid-cols-4'
                    : group.items.length > 1
                      ? 'grid-cols-2'
                      : 'grid-cols-1';
              return (
                <section
                  key={group.title}
                  className={cn(
                    'rounded-xl border-2 p-3 flex flex-col gap-2 shadow-sm',
                    styles.border, styles.bg, span,
                  )}
                  aria-label={group.title}
                >
                  <header className="flex items-center gap-2 px-1">
                    <span className={cn('h-2 w-2 rounded-full', styles.dot)} aria-hidden />
                    <h2 className={cn('text-xs font-bold uppercase tracking-wide', styles.title)}>
                      {group.title}
                    </h2>
                  </header>
                  <div className={cn('grid gap-2', innerCols)}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = item.to
                        ? (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))
                        : false;
                      const isTerceiros = item.action === 'open-terceiros';
                      const isImportMatriz = item.action === 'open-import-matriz';
                      const baseClass = cn(
                        'group flex flex-col items-center justify-center text-center gap-1 px-2 py-2.5 rounded-lg border bg-card transition-all min-h-[64px]',
                        active
                          ? 'bg-[hsl(var(--nr1-primary)/0.10)] border-[hsl(var(--nr1-primary))] text-[hsl(var(--nr1-primary))] shadow-sm font-bold'
                          : isTerceiros
                          ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 shadow-sm'
                          : isImportMatriz
                          ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400 shadow-sm'
                          : item.highlight
                          ? 'bg-[hsl(11_77%_60%/0.08)] border-[hsl(11_77%_60%/0.55)] text-[hsl(11_77%_45%)] hover:bg-[hsl(11_77%_60%/0.14)] hover:border-[hsl(11_77%_60%)] shadow-sm'
                          : 'border-border text-muted-foreground hover:border-[hsl(var(--nr1-primary))] hover:text-[hsl(var(--nr1-primary))] hover:bg-[hsl(var(--nr1-primary)/0.05)]'
                      );
                      const iconClass = cn('h-4 w-4 shrink-0', active ? 'text-[hsl(var(--nr1-primary))]' : isTerceiros ? 'text-blue-600 group-hover:text-blue-700' : isImportMatriz ? 'text-purple-600 group-hover:text-purple-700' : item.highlight ? 'text-[hsl(11_77%_55%)]' : 'text-muted-foreground group-hover:text-[hsl(var(--nr1-primary))]');
                      const inner = (
                        <>
                          <Icon className={iconClass} />
                          <span className="text-[11px] leading-tight font-semibold line-clamp-2">{item.label}</span>
                        </>
                      );
                      const node = !item.to ? (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            if (item.action === 'open-terceiros') setTerceirosOpen(true);
                            if (item.action === 'open-import-matriz') setImportMatrizOpen(true);
                            item.onClick?.();
                          }}
                          className={cn(baseClass, 'w-full')}
                        >
                          {inner}
                        </button>
                      ) : (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          data-nr1-active={active}
                          className={cn(baseClass, 'w-full')}
                        >
                          {inner}
                        </NavLink>
                      );

                      if (!item.desc) return node;
                      return (
                        <Tooltip key={item.to ?? item.label} delayDuration={150}>
                          <TooltipTrigger asChild>{node}</TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-snug">
                            <p className="font-semibold mb-0.5">{item.label}</p>
                            <p className="text-muted-foreground">{item.desc}</p>
                            {item.actions && item.actions.length > 0 && (
                              <div className="mt-1.5 pt-1.5 border-t border-border/50">
                                <p className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Principais ações</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {item.actions.map((a) => (
                                    <li key={a}>{a}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {item.shortcut && (
                              <div className="mt-1.5 pt-1.5 border-t border-border/50">
                                <button
                                  type="button"
                                  onClick={() => navigate(item.shortcut!.to)}
                                  className="text-[10px] text-[hsl(var(--nr1-primary))] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                  <item.shortcut.icon className="h-3 w-3" />
                                  {item.shortcut.label}
                                </button>
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Nr1ConsentGate />
      <Nr1BemEstarFloating />
      <Nr1TerceirosDialog open={terceirosOpen} onOpenChange={setTerceirosOpen} />
      <Nr1ImportarMatrizDialog open={importMatrizOpen} onOpenChange={setImportMatrizOpen} />
    </div>
    </TooltipProvider>
  );
};
