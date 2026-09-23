import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANDING_MODULES } from "@/config/landingModules";
import { supabase } from "@/integrations/supabase/client";
import { DemoDialog } from "./DemoDialog";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "NR-1", to: "/nr1" },
  { label: "Preços", to: "/precos" },
  { label: "Parceiros", to: "/parceiros" },
  { label: "Materiais", to: "/materiais" },
  { label: "Contato", to: "/contato" },
];

export const PublicHeader = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm"
          : "bg-background/80 backdrop-blur-sm"
      } border-b border-border/60`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center">
            <img
              src="/compsmart-logo-horizontal.png"
              alt="CompSmart — Gestão Estratégica de Pessoas"
              className="h-12 w-auto max-w-[144px] md:h-16 md:max-w-[190px] object-contain"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>

            <Link
              to="/nr1"
              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              NR-1
            </Link>


            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Módulos
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 bg-popover">
                {LANDING_MODULES.map((m) => (
                  <DropdownMenuItem key={m.slug} asChild>
                    <Link to={m.route} className="flex items-start gap-3 py-2">
                      <m.icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>
                        <span className="block text-sm font-medium">
                          {m.nomeCurto}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {m.resumo}
                        </span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {LINKS.slice(2).map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {l.label}
              </Link>
            ))}

            {isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border border-border bg-transparent text-foreground hover:bg-primary/5 hover:border-primary/40"
                onClick={() => navigate("/auth")}
              >
                Entrar
              </Button>
            )}
            <DemoDialog
              triggerLabel="Agendar demonstração"
              size="sm"
              className="bg-none bg-primary hover:bg-primary/90 hover:-translate-y-0 shadow-primary/25 hover:shadow-md"
            />
          </nav>

          <button
            className="lg:hidden p-2 text-muted-foreground"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <nav className="lg:hidden pb-5 pt-2 flex flex-col gap-1 border-t border-border/60">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
            <p className="pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Módulos
            </p>
            {LANDING_MODULES.map((m) => (
              <Link
                key={m.slug}
                to={m.route}
                onClick={() => setOpen(false)}
                className="py-2 text-sm text-muted-foreground hover:text-primary flex items-center gap-2"
              >
                <m.icon className="h-4 w-4 text-primary" />
                {m.nomeCurto}
              </Link>
            ))}
            <div className="pt-3">
              <DemoDialog triggerLabel="Agendar demonstração" className="w-full" />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
