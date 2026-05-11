import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Activity, Heart, FileText, ListChecks, ShoppingCart, ArrowLeft, Sparkles, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/nr1', label: 'Visão Geral', icon: Activity, end: true },
  { to: '/nr1/diagnostico/novo', label: 'Novo Diagnóstico', icon: FileText },
  { to: '/nr1/diagnosticos', label: 'Histórico', icon: ListChecks },
  { to: '/nr1/inteligencia', label: 'Inteligência', icon: Sparkles },
  { to: '/nr1/agente', label: 'Agente Bem-Estar', icon: Bot },
  { to: '/nr1/contratar', label: 'Plano NR-1', icon: ShoppingCart },
];

export const Nr1Layout = () => {
  const location = useLocation();
  return (
    <div className="nr1-scope min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center nr1-bg-primary">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Saúde, Bem-Estar & Performance</h1>
              <p className="text-xs text-muted-foreground">Conformidade NR-1 · Riscos Psicossociais</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
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
                  'flex items-center gap-2 px-3 py-2 text-sm border-b-2 transition-colors',
                  active
                    ? 'border-[hsl(var(--nr1-primary))] nr1-text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
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
