import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Activity, Brain, FileText, ListChecks, ArrowLeft, Sparkles, Bot, Radar, Shield, Users, GitBranch, UserCheck, ShieldAlert, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  { to: '/nr1/consentimento', label: 'Consentimento', icon: Lock },
];

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
        <div className="container mx-auto px-4 relative">
          {/* Left fade + arrow */}
          <button
            type="button"
            aria-label="Rolar abas para a esquerda"
            onClick={() => scrollBy(-1)}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-card border shadow-sm flex items-center justify-center transition-opacity',
              canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div
            className={cn(
              'pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-card to-transparent transition-opacity z-[5]',
              canLeft ? 'opacity-100' : 'opacity-0'
            )}
          />
          <div
            className={cn(
              'pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-card to-transparent transition-opacity z-[5]',
              canRight ? 'opacity-100' : 'opacity-0'
            )}
          />
          <button
            type="button"
            aria-label="Rolar abas para a direita"
            onClick={() => scrollBy(1)}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-card border shadow-sm flex items-center justify-center transition-opacity',
              canRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <nav
            ref={navRef}
            className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
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
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
