import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, LogOut, Rocket } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/LanguageSelector";

interface HeaderProps {
  isLoggedIn?: boolean;
}

export const Header = ({ isLoggedIn = false }: HeaderProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/98 backdrop-blur-md shadow-lg' 
          : 'bg-gradient-to-r from-white via-primary/5 to-secondary/5 dark:from-slate-900 dark:via-primary/10 dark:to-secondary/10 backdrop-blur-sm'
      }`}
    >
      {/* Gradient bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-emerald-500 to-primary opacity-80" />
      
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Logo with Launch Badge */}
          <div className="flex items-center gap-3">
            <img 
              src={compsmartLogo} 
              alt="CompSmart" 
              className="h-20 md:h-24 w-auto object-contain hover:scale-105 transition-transform cursor-pointer" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            <Badge 
              variant="outline" 
              className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 px-3 py-1.5 animate-pulse"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Janeiro 2026</span>
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection("solution")} 
              className="relative text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 group"
            >
              Funcionalidades
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-emerald-500 group-hover:w-full transition-all duration-300" />
            </button>
            <button 
              onClick={() => scrollToSection("pricing")} 
              className="relative text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 group"
            >
              Preços
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-emerald-500 group-hover:w-full transition-all duration-300" />
            </button>
            <button 
              onClick={() => scrollToSection("faq")} 
              className="relative text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 group"
            >
              FAQ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-emerald-500 group-hover:w-full transition-all duration-300" />
            </button>
            
            {isLoggedIn ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/dashboard")} 
                  size="sm"
                  className="border-primary/30 hover:border-primary hover:bg-primary/5"
                >
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
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/auth")} 
                  size="sm"
                  className="border-primary/30 hover:border-primary hover:bg-primary/5 font-medium"
                >
                  Entrar
                </Button>
                <Button 
                  onClick={() => navigate("/auth")} 
                  size="sm" 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300"
                >
                  Começar Grátis
                </Button>
              </>
            )}
            
            {/* Language Selector */}
            <LanguageSelector />
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t border-primary/10 pt-4 animate-fade-in">
            <Badge 
              variant="outline" 
              className="w-fit flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 px-3 py-1.5 mb-2"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Lançamento Janeiro 2026</span>
            </Badge>
            
            <button 
              onClick={() => scrollToSection("solution")} 
              className="text-left text-sm font-medium text-muted-foreground hover:text-primary py-2 border-b border-border/50"
            >
              Funcionalidades
            </button>
            <button 
              onClick={() => scrollToSection("pricing")} 
              className="text-left text-sm font-medium text-muted-foreground hover:text-primary py-2 border-b border-border/50"
            >
              Preços
            </button>
            <button 
              onClick={() => scrollToSection("faq")} 
              className="text-left text-sm font-medium text-muted-foreground hover:text-primary py-2 border-b border-border/50"
            >
              FAQ
            </button>
            
            <div className="flex flex-col gap-2 mt-2">
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
                  <Button 
                    onClick={() => navigate("/auth")} 
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/25"
                  >
                    Começar Grátis
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
