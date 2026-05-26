import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Activity, Brain, FileText, ListChecks, ArrowLeft, Sparkles, Bot, Radar, Shield, Users, GitBranch, UserCheck, ShieldAlert, ClipboardCheck, HeartPulse, Library, Heart, CalendarCheck, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Nr1ConsentGate } from '@/components/nr1/Nr1ConsentGate';
import { Nr1BemEstarFloating } from '@/components/nr1/Nr1BemEstarFloating';

const NAV = [
  { to: '/nr1/painel', label: 'Visão Geral', icon: Activity, end: true },
  { to: '/nr1/universo', label: 'Universo', icon: UserCheck },
  { to: '/nr1/fib', label: 'Bem-Estar Integral', icon: Radar },
  { to: '/nr1/seguranca-psicologica', label: 'Segurança Psicológica', icon: Shield },
  { to: '/nr1/sociodemografico', label: 'Sociodemográfico', icon: Users },
  { to: '/nr1/etapas', label: 'Etapas', icon: GitBranch },
  { to: '/nr1/diagnostico/novo', label: 'Novo Diagnóstico', icon: FileText },
  { to: '/nr1/diagnosticos', label: 'Histórico', icon: ListChecks },
  { to: '/nr1/planos-acao', label: 'Plano de Ação', icon: ClipboardCheck },
  { to: '/nr1/vitalidade', label: 'Vitalidade', icon: HeartPulse },
  { to: '/nr1/jornada', label: 'Minha Jornada', icon: Heart },
  { to: '/nr1/acompanhamento', label: 'Check up Semanal', icon: CalendarCheck },
  { to: '/nr1/inteligencia', label: 'Inteligência', icon: Sparkles },
  { to: '/nr1/biblioteca', label: 'Metodologias & Biblioteca', icon: Library },
  { to: '/nr1/clima', label: 'Pesquisa de Clima 360°', icon: ClipboardList, highlight: true },
] as Array<{ to: string; label: string; icon: any; end?: boolean; highlight?: boolean }>;

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
        <div className="container mx-auto px-4 pb-3">
          <nav
            ref={navRef}
            className="grid gap-2"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(108px, 1fr))' }}
          >
            {NAV.map((item) => {
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
                    'group flex flex-col items-center justify-center text-center gap-1 px-2 py-2.5 rounded-lg border transition-all min-h-[64px]',
                    active
                      ? 'bg-[hsl(var(--nr1-primary)/0.10)] border-[hsl(var(--nr1-primary))] text-[hsl(var(--nr1-primary))] shadow-sm font-bold'
                      : item.highlight
                      ? 'bg-[hsl(11_77%_60%/0.08)] border-[hsl(11_77%_60%/0.55)] text-[hsl(11_77%_45%)] hover:bg-[hsl(11_77%_60%/0.14)] hover:border-[hsl(11_77%_60%)] shadow-sm'
                      : 'bg-card border-border text-muted-foreground hover:border-[hsl(var(--nr1-primary))] hover:text-[hsl(var(--nr1-primary))] hover:bg-[hsl(var(--nr1-primary)/0.05)]'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[hsl(var(--nr1-primary))]' : item.highlight ? 'text-[hsl(11_77%_55%)]' : 'text-muted-foreground group-hover:text-[hsl(var(--nr1-primary))]')} />
                  <span className="text-[11px] leading-tight font-semibold line-clamp-2">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
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
