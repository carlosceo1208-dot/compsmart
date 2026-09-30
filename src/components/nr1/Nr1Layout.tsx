import { useRef, useState, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity, ArrowLeft, BookOpen, Brain, Building2, CalendarCheck, ChevronDown,
  ClipboardCheck, FileSearch, FileText, GitBranch, Grid3x3, Heart, HeartPulse,
  History, Library, Shield, ShieldAlert, Sparkles, Upload, UserCheck, Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Nr1BemEstarFloating } from '@/components/nr1/Nr1BemEstarFloating';
import { Nr1ConsentGate } from '@/components/nr1/Nr1ConsentGate';
import { Nr1ImportarMatrizDialog } from '@/components/nr1/Nr1ImportarMatrizDialog';
import { Nr1TerceirosDialog } from '@/components/nr1/terceiros/Nr1TerceirosDialog';
import { supabase } from '@/integrations/supabase/client';
import { useNr1Diagnosticos, useNr1Subscription } from '@/hooks/useNr1';
import { cn } from '@/lib/utils';

type NavAction = 'open-terceiros' | 'open-import-matriz';
type NavItem = {
  to?: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
  action?: NavAction;
  desc: string;
};
type JourneyGroup = { step: number; title: string; helper: string; items: NavItem[] };

const JOURNEY_GROUPS: JourneyGroup[] = [
  {
    step: 1,
    title: 'Preparar',
    helper: 'Organize a base e confirme as exigências legais.',
    items: [
      { to: '/nr1/painel', label: 'Visão Geral', icon: Activity, end: true, desc: 'Indicadores, conformidade e andamento do programa.' },
      { to: '/nr1/painel#plano-essencial', label: 'Plano NR-1 Essencial', icon: Shield, desc: 'Grau CNAE/INSS, exigências e situação de conformidade.' },
      { to: '/nr1/universo', label: 'Universo', icon: UserCheck, desc: 'Defina os colaboradores elegíveis para o diagnóstico.' },
    ],
  },
  {
    step: 2,
    title: 'Diagnosticar',
    helper: 'Crie o ciclo e acompanhe as etapas do programa.',
    items: [
      { to: '/nr1/diagnostico/novo', label: 'Novo Diagnóstico', icon: FileText, desc: 'Crie um novo ciclo de diagnóstico COPSOQ-III.' },
      { to: '/nr1/etapas', label: 'Etapas do Programa', icon: GitBranch, desc: 'Siga o roteiro de preparação, mensuração e transformação.' },
    ],
  },
  {
    step: 3,
    title: 'Agir',
    helper: 'Priorize riscos e transforme achados em ações.',
    items: [
      { to: '/nr1/matriz-risco', label: 'Matriz de Risco', icon: Grid3x3, desc: 'Avalie probabilidade e severidade dos riscos psicossociais.' },
      { to: '/nr1/planos-acao', label: 'Plano de Ação', icon: ClipboardCheck, desc: 'Gerencie responsáveis, prazos, evidências e aprovações.' },
    ],
  },
  {
    step: 4,
    title: 'Acompanhar',
    helper: 'Cuide da jornada e acompanhe os check-ups semanais.',
    items: [
      { to: '/nr1/jornada', label: 'Minha Jornada', icon: Heart, desc: 'Acesse a jornada pessoal de bem-estar.' },
      { to: '/nr1/acompanhamento', label: 'Check up Semanal', icon: CalendarCheck, desc: 'Registre e acompanhe os check-ups das 12 semanas.' },
    ],
  },
];

const EXTRA_ITEMS: NavItem[] = [
  { to: '/nr1/diagnosticos', label: 'Histórico', icon: History, desc: 'Consulte e compare os ciclos de diagnóstico.' },
  { label: 'Importar Matriz', icon: Upload, action: 'open-import-matriz', desc: 'Importe uma matriz existente com validação prévia.' },
  { label: 'Gestão de Terceiros', icon: Building2, action: 'open-terceiros', desc: 'Acompanhe a conformidade dos fornecedores.' },
  { to: '/nr1/vitalidade', label: 'Vitalidade', icon: HeartPulse, desc: 'Acompanhe indicadores de saúde ocupacional.' },
  { to: '/nr1/inteligencia', label: 'Inteligência', icon: Sparkles, desc: 'Consulte recomendações geradas a partir dos resultados.' },
  { to: '/nr1/seguranca-psicologica', label: 'Segurança Psicológica', icon: ShieldAlert, desc: 'Analise confiança, abertura e voz ativa nas equipes.' },
  { to: '/nr1/sociodemografico', label: 'Sociodemográfico', icon: Users, desc: 'Consulte recortes agregados para análise de equidade.' },
];

const FOOTER_ITEMS: NavItem[] = [
  { to: '/nr1/biblioteca', label: 'Glossário / Metodologias & Biblioteca', icon: Library, desc: 'Consulte referências e metodologias do programa.' },
  { to: '/nr1/auditoria', label: 'Auditoria & Segurança', icon: FileSearch, desc: 'Consulte acessos, atividades e eventos de segurança.' },
];

const useIsSuperAdmin = () => useQuery({
  queryKey: ['nr1-is-super-admin'],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'super_admin').maybeSingle();
    return Boolean(data);
  },
  staleTime: 5 * 60 * 1000,
});

export const Nr1Layout = () => {
  const location = useLocation();
  const navRef = useRef<HTMLDivElement | null>(null);
  const { data: isSuper } = useIsSuperAdmin();
  const { data: subscription } = useNr1Subscription();
  const { data: diagnostics } = useNr1Diagnosticos();
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [terceirosOpen, setTerceirosOpen] = useState(false);
  const [importMatrizOpen, setImportMatrizOpen] = useState(false);

  const suggestedPath = !subscription?.grau_risco_inss
    ? '/nr1/painel#plano-essencial'
    : !diagnostics?.length
      ? '/nr1/diagnostico/novo'
      : '/nr1/planos-acao';

  const isActive = (item: NavItem) => {
    if (!item.to) return false;
    const [path] = item.to.split('#');
    return item.end ? location.pathname === path : location.pathname.startsWith(path);
  };

  const handleAction = (action?: NavAction) => {
    if (action === 'open-terceiros') setTerceirosOpen(true);
    if (action === 'open-import-matriz') setImportMatrizOpen(true);
  };

  const renderItem = (item: NavItem, compact = false) => {
    const Icon = item.icon;
    const active = isActive(item);
    const suggested = item.to === suggestedPath;
    const content = (
      <>
        <Icon className={cn('shrink-0', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        <span className={cn('font-semibold', compact ? 'text-xs' : 'text-[11px] leading-tight text-center')}>{item.label}</span>
        {suggested && !compact && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warning" aria-label="Próximo passo sugerido" />}
      </>
    );
    const classes = cn(
      'relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      compact
        ? 'flex items-center gap-1.5 text-muted-foreground hover:text-foreground'
        : 'flex min-h-[68px] w-full flex-col items-center justify-center gap-1 rounded-md border bg-card px-2 py-2.5 text-muted-foreground hover:border-[hsl(var(--nr1-primary))] hover:bg-[hsl(var(--nr1-primary)/0.05)] hover:text-[hsl(var(--nr1-primary))]',
      active && !compact && 'border-[hsl(var(--nr1-primary))] bg-[hsl(var(--nr1-primary)/0.10)] text-[hsl(var(--nr1-primary))]',
      suggested && !compact && 'ring-2 ring-warning/40',
    );
    const node = item.to ? (
      <NavLink key={item.to} to={item.to} end={item.end} className={classes}>{content}</NavLink>
    ) : (
      <Button key={item.label} type="button" variant="ghost" onClick={() => handleAction(item.action)} className={cn(classes, 'h-auto')}>{content}</Button>
    );
    return (
      <Tooltip key={item.to ?? item.label}>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs">{item.desc}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="nr1-scope min-h-screen bg-gradient-to-b from-[hsl(var(--nr1-soft))] via-background to-background">
        {isSuper && (
          <div className="flex items-center justify-center gap-2 border-b border-warning/40 bg-warning-light px-4 py-1.5 text-xs text-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span><strong>Modo Super Admin · CompSmart</strong> — alguns painéis podem exibir dados demonstrativos para validação interna.</span>
          </div>
        )}
        <header className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="nr1-bg-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm"><Brain className="h-5 w-5" /></div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-semibold leading-tight">Saúde Mental & Bem-Estar</h1>
                  <Badge variant="destructive" className="text-[10px]">LEGAL OBRIGATÓRIO</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Conformidade NR-1 · Riscos Psicossociais</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild><NavLink to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Voltar</NavLink></Button>
          </div>

          <div ref={navRef} className="container mx-auto px-4 pb-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {JOURNEY_GROUPS.map((group) => (
                <section key={group.step} className="flex min-w-0 flex-col gap-2 rounded-lg border bg-background/70 p-3" aria-label={`${group.step}. ${group.title}`}>
                  <div className="flex items-start gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nr1-primary))] text-xs font-bold text-primary-foreground">{group.step}</span>
                    <div>
                      <h2 className="text-sm font-bold">{group.title}</h2>
                      <p className="text-[11px] leading-snug text-muted-foreground">{group.helper}</p>
                    </div>
                  </div>
                  <div className={cn('grid gap-2', group.items.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
                    {group.items.map((item) => renderItem(item))}
                  </div>
                </section>
              ))}
            </div>

            <Collapsible open={extrasOpen} onOpenChange={setExtrasOpen} className="mt-3 rounded-lg border bg-background/60">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="h-10 w-full justify-between rounded-lg px-3">
                  <span className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4 nr1-text-primary" />Mais recursos</span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', extrasOpen && 'rotate-180')} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t px-3 py-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{EXTRA_ITEMS.map((item) => renderItem(item))}</div>
              </CollapsibleContent>
            </Collapsible>

            <nav aria-label="Referências e segurança" className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t pt-3">
              {FOOTER_ITEMS.map((item) => renderItem(item, true))}
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6"><Outlet /></main>
        <Nr1ConsentGate />
        <Nr1BemEstarFloating />
        <Nr1TerceirosDialog open={terceirosOpen} onOpenChange={setTerceirosOpen} />
        <Nr1ImportarMatrizDialog open={importMatrizOpen} onOpenChange={setImportMatrizOpen} />
      </div>
    </TooltipProvider>
  );
};