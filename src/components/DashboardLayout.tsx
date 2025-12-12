import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
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
import { LogOut, User, Settings, Home, Users as UsersIcon, Network, DollarSign, ShieldCheck, Briefcase, Globe } from "lucide-react";
import { useLabels } from "@/contexts/LabelsContext";
import { toast } from "sonner";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { SecurityFooter } from "@/components/SecurityFooter";
import { CompanyLogo } from "@/components/CompanyLogo";
import { SupportWidget } from "@/components/support/SupportWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CompanySwitcher } from "@/components/dashboard/CompanySwitcher";
import { useCompanyContext } from "@/contexts/CompanyContext";

interface UserProfile {
  full_name: string;
  email: string;
  root_company_id: string | null;
  avatar_url: string | null;
}

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const { getLabel } = useLabels();
  const { activeCompany, isViewingOtherCompany } = useCompanyContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

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

      // Fetch company logo (will be overridden by context for super_admin)
      const { data: company } = await supabase
        .from("organizational_structure")
        .select("logo_url, name, fantasy_name")
        .eq("id", data.root_company_id)
        .single();

      if (company) {
        setCompanyLogo(company.logo_url || null);
        setCompanyName(company.fantasy_name || company.name);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  // Update logo/name when super_admin switches company
  useEffect(() => {
    if (activeCompany) {
      // Super admin visualizando outra empresa
      setCompanyLogo(activeCompany.logo_url || null);
      setCompanyName(activeCompany.fantasy_name || activeCompany.name);
    } else if (profile?.root_company_id) {
      // Voltou para "Minha empresa" - buscar dados da própria empresa
      const fetchOwnCompany = async () => {
        const { data: company } = await supabase
          .from("organizational_structure")
          .select("logo_url, name, fantasy_name")
          .eq("id", profile.root_company_id)
          .single();
        
        if (company) {
          setCompanyLogo(company.logo_url || null);
          setCompanyName(company.fantasy_name || company.name);
        }
      };
      fetchOwnCompany();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [activeCompany, profile?.root_company_id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Viewing Other Company Banner */}
      {isViewingOtherCompany && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 py-1.5 text-center text-sm text-amber-700 dark:text-amber-400">
          Você está visualizando: <strong>{companyName}</strong>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-20 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {companyLogo ? (
              <CompanyLogo logoUrl={companyLogo} companyName={companyName} size="md" />
            ) : (
              <img src={compsmartLogo} alt="CompSmart Logo" className="h-12 w-auto object-contain opacity-50" />
            )}
            <span className="text-sm text-muted-foreground hidden md:block max-w-[200px] truncate">
              {companyName || "CompSmart"}
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="hidden md:flex items-center hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-purple-700 dark:hover:from-purple-900 dark:hover:to-pink-900 dark:hover:text-purple-300 transition-all duration-300"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/employees")}
              className="hidden md:flex items-center hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-purple-700 dark:hover:from-purple-900 dark:hover:to-pink-900 dark:hover:text-purple-300 transition-all duration-300"
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              {getLabel('employee')}s
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/salary-ranges")}
              className="hidden md:flex items-center hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-purple-700 dark:hover:from-purple-900 dark:hover:to-pink-900 dark:hover:text-purple-300 transition-all duration-300"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Tabela Salarial
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/organograma")}
              className="hidden md:flex items-center hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-purple-700 dark:hover:from-purple-900 dark:hover:to-pink-900 dark:hover:text-purple-300 transition-all duration-300"
            >
              <Network className="w-4 h-4 mr-2" />
              Organograma
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/job-titles")}
              className="hidden md:flex items-center hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-purple-700 dark:hover:from-purple-900 dark:hover:to-pink-900 dark:hover:text-purple-300 transition-all duration-300"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Cargos & Salários
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/', '_blank')}
              className="hidden md:flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
            >
              <Globe className="w-4 h-4 mr-2" />
              Ver Site
            </Button>

            <CompanySwitcher />
            
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground">
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
