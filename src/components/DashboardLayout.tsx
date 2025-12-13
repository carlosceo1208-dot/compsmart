import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  LogOut, User, Settings, Home, Users as UsersIcon, Network, 
  DollarSign, ShieldCheck, Briefcase, Globe, Menu, ChevronRight 
} from "lucide-react";
import { useLabels } from "@/contexts/LabelsContext";
import { toast } from "sonner";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { SecurityFooter } from "@/components/SecurityFooter";
import { CompanyLogo } from "@/components/CompanyLogo";
import { SupportWidget } from "@/components/support/SupportWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CompanySwitcher } from "@/components/dashboard/CompanySwitcher";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface UserProfile {
  full_name: string;
  email: string;
  root_company_id: string | null;
  avatar_url: string | null;
}

// Route mapping for breadcrumbs
const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees": "Funcionários",
  "/salary-ranges": "Tabela Salarial",
  "/organograma": "Organograma",
  "/job-titles": "Cargos & Salários",
  "/my-profile": "Meu Perfil",
  "/settings": "Configurações",
  "/access-control": "Controle de Acesso",
  "/people-analytics": "People Analytics",
  "/benefits": "Benefícios",
  "/budget": "Orçamento",
  "/budget-planning": "Planejamento Orçamentário",
  "/budget-approvals": "Aprovações de Orçamento",
  "/incentive-programs": "Programas de Incentivos",
  "/legal-assistant": "Jurídico Smart",
  "/salary-assistant": "Salary Smart",
  "/incentive-assistant": "R&B Smart",
  "/organization": "Estrutura Organizacional",
  "/roles": "Perfis de Acesso",
  "/survey-data": "Pesquisas Salariais",
  "/salary-comparison": "Comparação Salarial",
  "/salary-analysis-report": "Relatório de Análise",
  "/alert-settings": "Configuração de Alertas",
  "/audit-logs": "Logs de Auditoria",
  "/knowledge-base": "Base de Conhecimento",
};

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getLabel } = useLabels();
  const { activeCompany, activeCompanyId, isViewingOtherCompany, ownCompanyId, isLoading: companyContextLoading } = useCompanyContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current page label for breadcrumbs
  const currentPath = location.pathname;
  const currentPageLabel = routeLabels[currentPath] || currentPath.replace("/", "").replace(/-/g, " ");
  const isHomePage = currentPath === "/dashboard";

  // Fetch user profile only - company data comes from context
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, root_company_id, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
        return;
      }

      setProfile(data);

      // Check if needs onboarding
      if (!data.root_company_id) {
        navigate("/onboarding");
        return;
      }

      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  // Update logo/name based on activeCompanyId (source of truth from context)
  useEffect(() => {
    // Wait for context to finish loading
    if (companyContextLoading) return;

    const companyIdToUse = activeCompanyId || profile?.root_company_id;
    
    if (!companyIdToUse) return;

    // If activeCompany data is already available and matches activeCompanyId, use it
    if (activeCompany && activeCompanyId) {
      setCompanyLogo(activeCompany.logo_url || null);
      setCompanyName(activeCompany.fantasy_name || activeCompany.name);
      return;
    }

    // Fetch company data for the active company ID
    const fetchCompanyData = async () => {
      const { data: company } = await supabase
        .from("organizational_structure")
        .select("logo_url, name, fantasy_name")
        .eq("id", companyIdToUse)
        .single();
      
      if (company) {
        setCompanyLogo(company.logo_url || null);
        setCompanyName(company.fantasy_name || company.name);
      }
    };
    
    fetchCompanyData();
  }, [activeCompanyId, activeCompany, profile?.root_company_id, companyContextLoading]);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={compsmartLogo} alt="CompSmart Logo" className="w-32 h-auto md:w-40 mx-auto animate-pulse object-contain" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Navigation items for mobile menu
  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: UsersIcon, label: getLabel('employee') + "s", path: "/employees" },
    { icon: DollarSign, label: "Tabela Salarial", path: "/salary-ranges" },
    { icon: Network, label: "Organograma", path: "/organograma" },
    { icon: Briefcase, label: "Cargos & Salários", path: "/job-titles" },
  ];

  const userItems = [
    { icon: User, label: "Meu Perfil", path: "/my-profile" },
    { icon: ShieldCheck, label: "Controle de Acesso", path: "/access-control" },
    { icon: Settings, label: "Configurações", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Viewing Other Company Banner */}
      {isViewingOtherCompany && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 py-1.5 text-center text-sm text-amber-700 dark:text-amber-400">
          Você está visualizando: <strong>{companyName}</strong>
        </div>
      )}

      {/* Header - Premium Gradient Style */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4 gap-4">
          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-2">
            {/* Mobile Hamburger Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader className="text-left pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <img src={compsmartLogo} alt="CompSmart" className="h-8 w-auto" />
                    <span className="text-lg font-semibold">Menu</span>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-1">
                  {/* Main Navigation */}
                  <p className="text-xs font-medium text-muted-foreground px-2 py-2">Navegação</p>
                  {navItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={currentPath === item.path ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => handleNavigate(item.path)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                  
                  <Separator className="my-3" />
                  
                  {/* User Menu */}
                  <p className="text-xs font-medium text-muted-foreground px-2 py-2">Conta</p>
                  {userItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={currentPath === item.path ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => handleNavigate(item.path)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                  
                  <Separator className="my-3" />
                  
                  {/* Site Link */}
                  <Button
                    variant="ghost"
                    className="justify-start text-muted-foreground"
                    onClick={() => window.open('/', '_blank')}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Ver Site
                  </Button>
                  
                  {/* Logout */}
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {companyLogo ? (
                <CompanyLogo logoUrl={companyLogo} companyName={companyName} size="sm" />
              ) : (
                <img src={compsmartLogo} alt="CompSmart Logo" className="h-10 w-auto object-contain" />
              )}
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={`transition-all duration-300 ${
                  currentPath === item.path 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary"
                }`}
              >
                <item.icon className="w-4 h-4 mr-1.5" />
                {item.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/', '_blank')}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
            >
              <Globe className="w-4 h-4 mr-1.5" />
              Ver Site
            </Button>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <CompanySwitcher />
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {profile ? getInitials(profile.full_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || "Usuário"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <Home className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/access-control")}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Controle de Acesso</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      {!isHomePage && (
        <div className="border-b border-border/40 bg-muted/30">
          <div className="container px-4 py-2">
            <nav className="flex items-center text-sm text-muted-foreground">
              <Link 
                to="/dashboard" 
                className="flex items-center hover:text-foreground transition-colors"
              >
                <Home className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 mx-2" />
              <span className="font-medium text-foreground">{currentPageLabel}</span>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container px-4 py-8 flex-1">
        <Outlet />
      </main>

      {/* Security Footer */}
      <SecurityFooter />
      
      {/* Support Widget - sempre visível */}
      <SupportWidget />
    </div>
  );
};
