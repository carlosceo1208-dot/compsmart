import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Activity, Brain, FileText, ListChecks, ArrowLeft, Sparkles, Bot, Grid3x3, Shield, Users, GitBranch, UserCheck, ShieldAlert, ClipboardCheck, HeartPulse, Library, Heart, CalendarCheck, ClipboardList, Network, BarChart3, LayoutGrid, DollarSign, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Nr1ConsentGate } from '@/components/nr1/Nr1ConsentGate';
import { Nr1BemEstarFloating } from '@/components/nr1/Nr1BemEstarFloating';
import { Nr1TerceirosDialog } from '@/components/nr1/terceiros/Nr1TerceirosDialog';

type NavItem = { to?: string; label: string; icon: any; end?: boolean; highlight?: boolean; onClick?: () => void; action?: 'open-terceiros' };
type NavGroup = { title: string; tone: 'nr1' | 'clima' | 'cruzamento' | 'fib' | 'jornada' | 'glossario'; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: 'NR-1',
    tone: 'nr1',
    items: [
      { to: '/nr1/painel', label: 'Visão Geral', icon: Activity, end: true },
      { to: '/nr1/universo', label: 'Universo', icon: UserCheck },
      { to: '/nr1/fib', label: 'Matriz de Risco', icon: Grid3x3 },
      { to: '/nr1/seguranca-psicologica', label: 'Segurança Psicológica', icon: Shield },
      { to: '/nr1/sociodemografico', label: 'Sociodemográfico', icon: Users },
      { to: '/nr1/etapas', label: 'Etapas', icon: GitBranch },
      { to: '/nr1/diagnostico/novo', label: 'Novo Diagnóstico', icon: FileText },
      { to: '/nr1/diagnosticos', label: 'Histórico', icon: ListChecks },
      { to: '/nr1/planos-acao', label: 'Plano de Ação', icon: ClipboardCheck },
      { to: '/nr1/vitalidade', label: 'Vitalidade', icon: HeartPulse },
      { to: '/nr1/inteligencia', label: 'Inteligência', icon: Sparkles },
    ],
  },
  {
    title: 'Clima Organizacional',
    tone: 'clima',
    items: [
      { to: '/nr1/clima', label: 'Pesquisa de Clima 360°', icon: ClipboardList, highlight: true },
    ],
  },
  {
    title: 'Cruzamento Riscos Psicossociais',
    tone: 'cruzamento',
    items: [
      { to: '/performance/evaluations', label: 'Avaliação de Desempenho', icon: BarChart3 },
      { to: '/performance/9box', label: '9Box', icon: LayoutGrid },
      { to: '/nr1/clima', label: 'Pesquisa de Clima', icon: ClipboardList },
      { to: '/dashboard', label: 'Remuneração', icon: DollarSign },
    ],
  },
  {
    title: 'Índice de Felicidade',
    tone: 'fib',
    items: [
      { to: '/nr1/fib-bem-estar', label: 'FIB', icon: Heart },
    ],
  },
  {
    title: 'Acompanhamento Colaborador',
    tone: 'jornada',
    items: [
      { to: '/nr1/jornada', label: 'Minha Jornada', icon: Heart },
      { to: '/nr1/acompanhamento', label: 'Check up Semanal', icon: CalendarCheck },
    ],
  },
  {
    title: 'Glossário',
    tone: 'glossario',
    items: [
      { to: '/nr1/biblioteca', label: 'Metodologias & Biblioteca', icon: Library },
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
  const { data: isSuper } = useIsSuperAdmin();
  const navRef = useRef<HTMLDivElement | null>(null);

  return (
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
                      const active = item.end
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          data-nr1-active={active}
                          className={cn(
                            'group flex flex-col items-center justify-center text-center gap-1 px-2 py-2.5 rounded-lg border bg-card transition-all min-h-[64px]',
                            active
                              ? 'bg-[hsl(var(--nr1-primary)/0.10)] border-[hsl(var(--nr1-primary))] text-[hsl(var(--nr1-primary))] shadow-sm font-bold'
                              : item.highlight
                              ? 'bg-[hsl(11_77%_60%/0.08)] border-[hsl(11_77%_60%/0.55)] text-[hsl(11_77%_45%)] hover:bg-[hsl(11_77%_60%/0.14)] hover:border-[hsl(11_77%_60%)] shadow-sm'
                              : 'border-border text-muted-foreground hover:border-[hsl(var(--nr1-primary))] hover:text-[hsl(var(--nr1-primary))] hover:bg-[hsl(var(--nr1-primary)/0.05)]'
                          )}
                        >
                          <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[hsl(var(--nr1-primary))]' : item.highlight ? 'text-[hsl(11_77%_55%)]' : 'text-muted-foreground group-hover:text-[hsl(var(--nr1-primary))]')} />
                          <span className="text-[11px] leading-tight font-semibold line-clamp-2">{item.label}</span>
                        </NavLink>
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
    </div>
  );
};
