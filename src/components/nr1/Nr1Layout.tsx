import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Activity, Brain, FileText, ListChecks, ArrowLeft, Sparkles, Bot, Radar, Shield, Users, GitBranch, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/nr1', label: 'Visão Geral', icon: Activity, end: true },
  { to: '/nr1/universo', label: 'Universo', icon: UserCheck },
  { to: '/nr1/fib', label: 'Bem-Estar Integral', icon: Radar },
  { to: '/nr1/seguranca-psicologica', label: 'Segurança Psicológica', icon: Shield },
  { to: '/nr1/sociodemografico', label: 'Sociodemográfico', icon: Users },
  { to: '/nr1/etapas', label: 'Etapas', icon: GitBranch },
  { to: '/nr1/diagnostico/novo', label: 'Novo Diagnóstico', icon: FileText },
  { to: '/nr1/diagnosticos', label: 'Histórico', icon: ListChecks },
  { to: '/nr1/inteligencia', label: 'Inteligência', icon: Sparkles },
  { to: '/nr1/agente', label: 'Agente Bem-Estar', icon: Bot },
];

export const Nr1Layout = () => {
  const location = useLocation();
  return (
    <div className="nr1-scope min-h-screen bg-gradient-to-b from-[hsl(var(--nr1-soft))] via-background to-background">
      <header className="border-b bg-card relative overflow-hidden">
        {/* Accent stripe — verde→amarelo (laço verde + setembro amarelo) */}
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
        <nav className="container mx-auto px-4 flex gap-1 overflow-x-auto">
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
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm border-b-2 transition-colors whitespace-nowrap',
                  active
                    ? 'border-[hsl(var(--nr1-primary))] nr1-text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-[hsl(var(--nr1-primary))] hover:border-[hsl(var(--nr1-accent))]'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
