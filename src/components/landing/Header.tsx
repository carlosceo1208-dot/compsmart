import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import compsmartLogo from "@/assets/compsmart-logo.png";

interface HeaderProps {
  isLoggedIn?: boolean;
}

export const Header = ({ isLoggedIn = false }: HeaderProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img src={compsmartLogo} alt="CompSmart" className="h-20 md:h-24 w-auto object-contain hover:scale-105 transition-transform" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection("solution")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Funcionalidades
            </button>
            <button onClick={() => scrollToSection("pricing")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Preços
            </button>
            <button onClick={() => scrollToSection("faq")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </button>
            
            {isLoggedIn ? (
              <>
                <Button variant="outline" onClick={() => navigate("/dashboard")} size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Ir para Dashboard
                </Button>
                <Button variant="ghost" onClick={handleLogout} size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/auth")} size="sm">
                  Entrar
                </Button>
                <Button onClick={() => navigate("/auth")} size="sm" className="bg-gradient-primary">
                  Começar Grátis
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-primary"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t border-border pt-4">
            <button onClick={() => scrollToSection("solution")} className="text-left text-sm text-muted-foreground hover:text-primary">
              Funcionalidades
            </button>
            <button onClick={() => scrollToSection("pricing")} className="text-left text-sm text-muted-foreground hover:text-primary">
              Preços
            </button>
            <button onClick={() => scrollToSection("faq")} className="text-left text-sm text-muted-foreground hover:text-primary">
              FAQ
            </button>
            
            {isLoggedIn ? (
              <>
                <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Ir para Dashboard
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">
                  Entrar
                </Button>
                <Button onClick={() => navigate("/auth")} className="w-full bg-gradient-primary">
                  Começar Grátis
                </Button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
