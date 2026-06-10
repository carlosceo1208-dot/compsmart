import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, LayoutDashboard, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthCTA } from '@/hooks/useAuthCTA';
import { supabase } from '@/integrations/supabase/client';

interface Nr1HeaderProps {
  onAnchor: (id: string) => void;
}

export default function Nr1Header({ onAnchor }: Nr1HeaderProps) {
  const { ctaTo, isLoggedIn } = useAuthCTA();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const navItems = [
    { id: 'funcionalidades', label: 'Funcionalidades' },
    { id: 'planos', label: 'Planos' },
    { id: 'faq', label: 'FAQ' },
    { id: 'novidades', label: 'Novidades' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center nr1-bg-primary">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm">CompSmart</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">A Inteligência trabalhando com você</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onAnchor(item.id)}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ))}
          <Link
            to="/ativar-conta"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Ativar conta
          </Link>
          <Badge className="nr1-bg-primary text-white border-0 gap-1 ml-1">
            <ShieldCheck className="h-3 w-3" /> NR-1
          </Badge>
          <button
            onClick={() => onAnchor('novidades')}
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5" /> Novidades
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link to={ctaTo}>
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              {isLoggedIn ? 'Ir para Dashboard' : 'Entrar'}
            </Link>
          </Button>
          {isLoggedIn && (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-1" /> Sair
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="lg:hidden border-t overflow-x-auto">
        <div className="container mx-auto px-4 py-2 flex items-center gap-3 text-sm whitespace-nowrap">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onAnchor(item.id)}
              className="text-muted-foreground hover:text-foreground font-medium"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
