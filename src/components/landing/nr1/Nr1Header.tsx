import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
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
    { id: 'faq', label: 'FAQ' },
    { id: 'novidades', label: 'Novidades' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center flex-shrink-0" aria-label="CompSmart — página inicial">
          <img src="/compsmart-logo-horizontal.png" alt="CompSmart" className="h-12 w-auto max-w-[142px] sm:h-14 sm:max-w-[170px] object-contain" />
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
          <Link to="/precos" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Preços</Link>
          <Link
            to="/ativar-conta"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Ativar conta
          </Link>
          <Badge className="bg-primary text-primary-foreground border-0 gap-1 ml-1">
            <ShieldCheck className="h-3 w-3" /> NR-1
          </Badge>
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
          <Link to="/precos" className="text-muted-foreground hover:text-foreground font-medium">Preços</Link>
        </div>
      </div>
    </header>
  );
}
