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
  DollarSign, ShieldCheck, Briefcase, Globe, Menu, ChevronRight, ArrowLeft, Shield,
  Bot, Sparkles, Scale, BadgeDollarSign, Gift, Wallet, Inbox, GitCompare
} from "lucide-react";
import { useLabels } from "@/contexts/LabelsContext";
import { toast } from "sonner";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { SecurityFooter } from "@/components/SecurityFooter";
import { CompanyLogo } from "@/components/CompanyLogo";
import { SupportWidget } from "@/components/support/SupportWidget";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CompanySwitcher } from "@/components/dashboard/CompanySwitcher";
import { HeaderNotifications } from "@/components/dashboard/HeaderNotifications";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { TrialExpiredBlockScreen } from "@/components/dashboard/TrialExpiredBlockScreen";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { KudosConfetti } from "@/components/kudos/KudosConfetti";
import { KudosNotificationPopup } from "@/components/kudos/KudosNotificationPopup";
import { useKudosNotifications } from "@/hooks/useKudosNotifications";

interface UserProfile {
  full_name: string;
  email: string;
  root_company_id: string | null;
  avatar_url: string | null;
}

// Route mapping for breadcrumbs
const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees": "Colaboradores",
  "/salary-ranges": "Tabela Salarial",
  "/organograma": "Organograma",
  "/job-titles": "Plano de Cargos",
  "/my-profile": "Meu Perfil",
  "/settings": "Configurações",
  "/access-control": "Controle de Acesso",
  "/people-analytics": "People Analytics",
  "/benefits": "Benefícios",
  "/budget": "Orçamento",
  "/budget-planning": "Planejamento de Orçamento",
  "/budget-approvals": "Aprovações de Orçamento",
  "/incentive-programs": "Programas de Incentivos",
  "/legal-assistant": "Assistente Jurídico",
  "/salary-assistant": "Assistente Salarial",
  "/incentive-assistant": "Assistente de R&B",
  "/organization": "Estrutura Organizacional",
  "/roles": "Perfis de Acesso",
  "/survey-data": "Pesquisa Salarial",
  "/salary-comparison": "Comparação Salarial",
  "/salary-analysis-report": "Análise Salarial",
  "/alert-settings": "Alertas Automáticos",
  "/audit-logs": "Auditoria de Acesso",
  "/data-audit": "Auditoria de Dados",
  "/knowledge-base": "Base de Conhecimento",
  "/settings/plans": "Configurações",
  "/settings/billing": "Configurações",
  "/settings/landing-content": "Configurações",
  "/settings/my-plan": "Configurações",
  "/super-admin": "Painel Super Admin",
  "/security-dashboard": "Monitoramento de Segurança",
  "/total-rewards": "Total Rewards Statement",
  "/budget-burndown": "Budget Burn-Down",
  "/approval-inbox": "Inbox de Aprovações",
  "/decision-scenarios": "Cenários de Decisão",
};

// Parent route mapping for hierarchical navigation
const routeParents: Record<string, string> = {
  "/settings/plans": "/settings",
  "/settings/billing": "/settings",
  "/settings/landing-content": "/settings",
  "/settings/my-plan": "/settings",
  "/budget-planning": "/budget",
  "/budget-approvals": "/budget",
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
  
  // Feature access hook for trial/blocking
  const { 
    status, 
    daysLeftInTrial, 
    trialEndsAt, 
    isBlocked, 
    daysUntilDeletion,
    loading: featureLoading 
  } = useFeatureAccess();

  // Check if user is super admin
  const { data: roleData } = useCurrentUserRole();
  
  // Kudos notification system
  const { showConfetti, showPopup, currentKudos, dismissNotification } = useKudosNotifications();
  
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

      // Check if needs onboarding - BUT only for non-employee users
      // Employees should NEVER be redirected to company onboarding
      if (!data.root_company_id) {
        // First check if user has employee role - they shouldn't do company onboarding
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
        
        const userRoles = roles?.map(r => r.role) || [];
        const isEmployee = userRoles.includes('employee');
        
        // If employee without company, try to find matching profile by email
        if (isEmployee) {
          console.log('Employee without root_company_id - checking for original profile...');
          
          // Try to find original profile with same email that has root_company_id
          const { data: matchingProfile } = await supabase
            .from('profiles')
            .select('root_company_id, full_name, job_title, grade, salary')
            .eq('email', data.email)
            .not('root_company_id', 'is', null)
            .neq('id', session.user.id)
            .maybeSingle();
          
          if (matchingProfile?.root_company_id) {
            console.log('Found original profile, syncing data...');
            // Copy data from original profile
            await supabase
              .from('profiles')
              .update({
                root_company_id: matchingProfile.root_company_id,
                full_name: matchingProfile.full_name || data.full_name,
                job_title: matchingProfile.job_title,
                grade: matchingProfile.grade,
                salary: matchingProfile.salary,
              })
              .eq('id', session.user.id);
            
            // Reload the page to get updated data
            window.location.reload();
            return;
          }
          
          // If no matching profile found, show error and don't redirect to onboarding
          console.error('Employee without company - contact admin');
          setLoading(false);
          return;
        }
        
        // Only non-employees (admins creating companies) should go to onboarding
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
    toast.success("Logout realizado com sucesso!");
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

  if (loading || featureLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={compsmartLogo} alt="CompSmart Logo" className="w-32 h-auto md:w-40 mx-auto animate-pulse object-contain" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // If blocked (trial expired), show block screen
  if (isBlocked) {
    return (
      <TrialExpiredBlockScreen 
        daysUntilDeletion={daysUntilDeletion} 
        companyName={companyName || "Sua empresa"} 
      />
    );
  }

  // AI Agents menu items
  const aiAgents = [
    { icon: Scale, label: "Jurídico Smart", path: "/legal-assistant", description: "Consultoria jurídica trabalhista" },
    { icon: BadgeDollarSign, label: "Salary Smart", path: "/salary-assistant", description: "Análise e estratégia salarial" },
    { icon: Gift, label: "R&B Smart", path: "/incentive-assistant", description: "Remuneração e benefícios" },
    { icon: Bot, label: "PerformAI", path: "/performance/assistant", description: "Assistente de desempenho" },
  ];

  // Navigation items for mobile menu
  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: UsersIcon, label: "Colaboradores", path: "/employees" },
    { icon: DollarSign, label: "Tabela Salarial", path: "/salary-ranges" },
    { icon: Network, label: "Organograma", path: "/organograma" },
    { icon: Briefcase, label: "Plano de Cargos", path: "/job-titles" },
    { icon: Wallet, label: "Budget Burn-Down", path: "/budget-burndown" },
    { icon: Inbox, label: "Aprovações", path: "/approval-inbox" },
    { icon: GitCompare, label: "Cenários de Decisão", path: "/decision-scenarios" },
  ];

  const userItems = [
    { icon: User, label: "Meu Perfil", path: "/my-profile" },
    { icon: ShieldCheck, label: "Controle de Acesso", path: "/access-control" },
    { icon: Settings, label: "Configurações", path: "/settings" },
    ...(roleData?.isSuperAdmin ? [{ icon: Shield, label: "Segurança", path: "/security-dashboard" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Kudos Celebration Components */}
      <KudosConfetti isActive={showConfetti} />
      <KudosNotificationPopup 
        isOpen={showPopup} 
        onClose={dismissNotification} 
        kudos={currentKudos} 
      />
      
      {/* Trial Banner - shows during trial period */}
      {status === 'trial' && daysLeftInTrial !== null && trialEndsAt && (
        <TrialBanner daysLeft={daysLeftInTrial} trialEndsAt={trialEndsAt} />
      )}

      {/* Viewing Other Company Banner */}
      {isViewingOtherCompany && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 py-1.5 text-center text-sm text-amber-700 dark:text-amber-400">
          Visualizando empresa: <strong>{companyName}</strong>
        </div>
      )}

      {/* Header - Premium Emerald Gradient Style */}
      <header className="sticky top-0 z-50 w-full border-b border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/80 dark:from-emerald-950/50 dark:via-slate-900 dark:to-emerald-950/50 shadow-sm">
        <div className="w-full flex h-16 items-center justify-between px-2 md:px-4 gap-2 md:gap-4 max-w-none">
          {/* Left: Mobile Menu + Logo CompSmart */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mobile Hamburger Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden hover:bg-emerald-100 dark:hover:bg-emerald-900/50">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader className="text-left pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <img src={compsmartLogo} alt="CompSmart" className="h-10 w-auto" />
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">CompSmart</span>
                      <span className="text-[10px] text-muted-foreground -mt-0.5">Gestão de Remuneração</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-1">
                  {/* Main Navigation */}
                  <p className="text-xs font-medium text-muted-foreground px-2 py-2">Navegação</p>
                  {navItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={currentPath === item.path ? "default" : "ghost"}
                      className={`justify-start ${
                        currentPath === item.path 
                          ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                          : "hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-400"
                      }`}
                      onClick={() => handleNavigate(item.path)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                  
                  <Separator className="my-3" />
                  
                  {/* AI Agents */}
                  <p className="text-xs font-medium text-muted-foreground px-2 py-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-violet-500" /> Agentes IA
                  </p>
                  {aiAgents.map((agent) => (
                    <Button
                      key={agent.path}
                      variant={currentPath === agent.path ? "default" : "ghost"}
                      className={`justify-start ${
                        currentPath === agent.path 
                          ? "bg-violet-500 text-white hover:bg-violet-600" 
                          : "hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/50 dark:hover:text-violet-400"
                      }`}
                      onClick={() => handleNavigate(agent.path)}
                    >
                      <agent.icon className="mr-2 h-4 w-4" />
                      {agent.label}
                    </Button>
                  ))}
                  
                  <Separator className="my-3" />
                  
                  {/* User Menu */}
                  <p className="text-xs font-medium text-muted-foreground px-2 py-2">Conta</p>
                  {userItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={currentPath === item.path ? "default" : "ghost"}
                      className={`justify-start ${
                        currentPath === item.path 
                          ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                          : "hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-400"
                      }`}
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
                    className="justify-start text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/50"
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

            {/* Logo CompSmart - Always Visible */}
              <Link to="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
                <img src={compsmartLogo} alt="CompSmart Logo" className="h-10 md:h-12 w-auto object-contain" />
              </Link>
          </div>

          {/* Center: Desktop Navigation - Emerald Buttons */}
          {/* 2xl: shows full labels, lg-xl: icons only */}
          <nav className="hidden lg:flex items-center gap-1 justify-center flex-1 min-w-0 overflow-hidden">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={`px-2 lg:px-3 transition-all duration-300 border ${
                  currentPath === item.path 
                    ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/25" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/70"
                }`}
                title={item.label}
              >
                <item.icon className="w-3.5 h-3.5 lg:mr-1" />
                <span className="hidden lg:inline">{item.label}</span>
              </Button>
            ))}
            {/* AI Agents Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 lg:px-3 transition-all duration-300 border bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-violet-200 hover:from-violet-100 hover:to-purple-100 hover:border-violet-300 dark:from-violet-950/50 dark:to-purple-950/50 dark:text-violet-400 dark:border-violet-800 dark:hover:from-violet-900/70 dark:hover:to-purple-900/70"
                  title="Agentes de IA"
                >
                  <Sparkles className="w-3.5 h-3.5 lg:mr-1" />
                  <span className="hidden lg:inline">IA</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  <span>Agentes Smart</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {aiAgents.map((agent) => (
                  <DropdownMenuItem
                    key={agent.path}
                    onClick={() => navigate(agent.path)}
                    className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/30"
                  >
                    <agent.icon className="h-4 w-4 mt-0.5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{agent.label}</span>
                      <span className="text-xs text-muted-foreground">{agent.description}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/', '_blank')}
              title="Ver Site"
              className="px-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 transition-all duration-300"
            >
              <Globe className="w-3.5 h-3.5" />
            </Button>
          </nav>

          {/* Right: Company Name + Actions */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Company Indicator - Enhanced badge for all users - only on xl+ */}
            {companyName && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full border border-emerald-200 dark:border-emerald-800">
                {companyLogo ? (
                  <img src={companyLogo} alt={companyName} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs">🏢</span>
                )}
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 max-w-[120px] truncate">
                  {companyName}
                </span>
                {activeCompany?.planName && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-white/50 dark:bg-black/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400">
                    {activeCompany.planName}
                  </Badge>
                )}
              </div>
            )}

            {/* Company Switcher and Notifications - visible on md+ screens */}
            <div className="hidden md:flex items-center gap-1">
              <CompanySwitcher />
              <HeaderNotifications />
            </div>
            
            {/* Essential items - ALWAYS visible */}
            <ThemeToggle className="flex-shrink-0" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-emerald-200 dark:ring-emerald-800 hover:ring-emerald-400 transition-all">
                  <Avatar className="h-9 w-9">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                    )}
                    <AvatarFallback className="bg-emerald-500 text-white text-sm font-medium">
                      {profile ? getInitials(profile.full_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || "Colaborador"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-profile")} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/access-control")} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Controle de Acesso</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                {roleData?.isSuperAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/super-admin")} className="hover:bg-purple-50 dark:hover:bg-purple-900/50">
                      <Shield className="mr-2 h-4 w-4 text-purple-600" />
                      <span className="text-purple-600 dark:text-purple-400 font-medium">Painel Plataforma</span>
                    </DropdownMenuItem>
                  </>
                )}
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

      {/* Breadcrumbs with Back Button */}
      {!isHomePage && (
        <div className="border-b border-border/40 bg-muted/30">
          <div className="container px-4 py-2">
            <nav className="flex items-center text-sm text-muted-foreground gap-2">
              {/* Back Button - appears on sub-routes */}
              {routeParents[currentPath] && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(routeParents[currentPath])}
                  className="h-7 px-2 mr-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              )}

              {/* Dashboard Link */}
              <Link 
                to="/dashboard" 
                className="flex items-center hover:text-foreground transition-colors"
              >
                <Home className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              {/* Parent Page (if exists) */}
              {routeParents[currentPath] && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <Link 
                    to={routeParents[currentPath]}
                    className="hover:text-foreground transition-colors"
                  >
                    {routeLabels[routeParents[currentPath]] || routeParents[currentPath]}
                  </Link>
                </>
              )}

              {/* Current Page */}
              <ChevronRight className="h-3.5 w-3.5" />
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
      
      {/* Feedback Widget - coleta sugestões dos usuários */}
      <FeedbackWidget />
      
      {/* Support Widget - sempre visível */}
      <SupportWidget />
    </div>
  );
};