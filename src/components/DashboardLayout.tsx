import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  DollarSign, ShieldCheck, Briefcase, Globe, Menu, ChevronRight, ArrowLeft 
} from "lucide-react";
import { useLabels } from "@/contexts/LabelsContext";
import { toast } from "sonner";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { SecurityFooter } from "@/components/SecurityFooter";
import { CompanyLogo } from "@/components/CompanyLogo";
import { SupportWidget } from "@/components/support/SupportWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CompanySwitcher } from "@/components/dashboard/CompanySwitcher";
import { HeaderNotifications } from "@/components/dashboard/HeaderNotifications";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  full_name: string;
  email: string;
  root_company_id: string | null;
  avatar_url: string | null;
}

// Route mapping for breadcrumbs - now using i18n keys
const routeLabelKeys: Record<string, string> = {
  "/dashboard": "menu.dashboard",
  "/employees": "menu.employees",
  "/salary-ranges": "menu.salary_table",
  "/organograma": "menu.organogram",
  "/job-titles": "menu.job_titles",
  "/my-profile": "menu.profile",
  "/settings": "menu.settings",
  "/access-control": "menu.access_control",
  "/people-analytics": "modules.people_analytics",
  "/benefits": "benefits.title",
  "/budget": "budget.title",
  "/budget-planning": "budget_planning.title",
  "/budget-approvals": "budget_approvals.title",
  "/incentive-programs": "incentives.title",
  "/legal-assistant": "modules.legal_smart",
  "/salary-assistant": "modules.salary_smart",
  "/incentive-assistant": "modules.rb_smart",
  "/organization": "modules.org_management",
  "/roles": "modules.profile_management",
  "/survey-data": "modules.salary_survey",
  "/salary-comparison": "modules.salary_comparison",
  "/salary-analysis-report": "modules.salary_analysis",
  "/alert-settings": "modules.auto_alerts",
  "/audit-logs": "modules.access_audit",
  "/data-audit": "modules.data_audit",
  "/knowledge-base": "modules.knowledge_base",
  "/settings/plans": "menu.settings",
  "/settings/billing": "menu.settings",
  "/settings/landing-content": "menu.settings",
  "/settings/my-plan": "menu.settings",
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
  const { t } = useTranslation();
  const { getLabel } = useLabels();
  const { activeCompany, activeCompanyId, isViewingOtherCompany, ownCompanyId, isLoading: companyContextLoading } = useCompanyContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current page label for breadcrumbs
  const currentPath = location.pathname;
  const currentPageLabelKey = routeLabelKeys[currentPath];
  const currentPageLabel = currentPageLabelKey ? t(currentPageLabelKey) : currentPath.replace("/", "").replace(/-/g, " ");
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
    toast.success(t('message.success'));
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
          <p className="text-muted-foreground">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  // Navigation items for mobile menu - using i18n keys
  const navItems = [
    { icon: Home, labelKey: "menu.dashboard", path: "/dashboard" },
    { icon: UsersIcon, labelKey: "menu.employees", path: "/employees" },
    { icon: DollarSign, labelKey: "menu.salary_table", path: "/salary-ranges" },
    { icon: Network, labelKey: "menu.organogram", path: "/organograma" },
    { icon: Briefcase, labelKey: "menu.job_titles", path: "/job-titles" },
  ];

  const userItems = [
    { icon: User, labelKey: "menu.profile", path: "/my-profile" },
    { icon: ShieldCheck, labelKey: "menu.access_control", path: "/access-control" },
    { icon: Settings, labelKey: "menu.settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Viewing Other Company Banner */}
      {isViewingOtherCompany && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 py-1.5 text-center text-sm text-amber-700 dark:text-amber-400">
          {t('dashboard.viewing_company')}: <strong>{companyName}</strong>
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
                      <span className="text-[10px] text-muted-foreground -mt-0.5">{t('app.tagline')}</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-1">
                  {/* Main Navigation */}
                  <p className="text-xs font-medium text-muted-foreground px-2 py-2">{t('menu.navigation')}</p>
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
                      {t(item.labelKey)}
                    </Button>
                  ))}
                  
                  <Separator className="my-3" />
                  
                  {/* User Menu */}
                  <p className="text-xs font-medium text-muted-foreground px-2 py-2">{t('menu.account')}</p>
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
                      {t(item.labelKey)}
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
                    {t('menu.view_site')}
                  </Button>
                  
                  {/* Logout */}
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('menu.logout')}
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
          {/* xl: shows full labels, lg: shows icons only, hidden below lg */}
          <nav className="hidden lg:flex items-center gap-1 justify-center flex-1 min-w-0">
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
                title={t(item.labelKey)}
              >
                <item.icon className="w-3.5 h-3.5 lg:mr-1" />
                <span className="hidden lg:inline">{t(item.labelKey)}</span>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/', '_blank')}
              title={t('menu.view_site')}
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

            {/* Mobile/Tablet Company Badge */}
            {companyName && (
              <div className="xl:hidden flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                {companyLogo ? (
                  <img src={companyLogo} alt={companyName} className="h-4 w-4 rounded-full object-cover" />
                ) : (
                  <span className="text-xs">🏢</span>
                )}
              </div>
            )}
            
            {/* These items hidden on smaller screens */}
            <div className="hidden xl:flex items-center gap-1">
              <CompanySwitcher />
              <HeaderNotifications />
            </div>
            
            {/* Essential items - ALWAYS visible */}
            <LanguageSelector className="flex-shrink-0" />
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
                      {profile?.full_name || t('label.employee')}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                  <Home className="mr-2 h-4 w-4" />
                  <span>{t('menu.dashboard')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-profile")} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('menu.profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/access-control")} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>{t('menu.access_control')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/50">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('menu.settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('menu.logout')}</span>
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
                  {t('action.back')}
                </Button>
              )}

              {/* Dashboard Link */}
              <Link 
                to="/dashboard" 
                className="flex items-center hover:text-foreground transition-colors"
              >
                <Home className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">{t('menu.dashboard')}</span>
              </Link>

              {/* Parent Page (if exists) */}
              {routeParents[currentPath] && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <Link 
                    to={routeParents[currentPath]}
                    className="hover:text-foreground transition-colors"
                  >
                    {routeLabelKeys[routeParents[currentPath]] ? t(routeLabelKeys[routeParents[currentPath]]) : routeParents[currentPath]}
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
      
      {/* Support Widget - sempre visível */}
      <SupportWidget />
    </div>
  );
};
