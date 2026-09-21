import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, UserPlus, Calendar, MoreVertical, Edit, UserX, Upload, UserCheck, Loader2,
  Users as UsersIcon, UserCheck2, UserMinus, LayoutGrid, LayoutList, Mail, Send, AlertCircle, Lock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserDialog } from "@/components/UserDialog";
import { EmployeeBulkImport } from "@/components/EmployeeBulkImport";
import { formatCurrency } from "@/lib/formatters";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  employee_number: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  job_title: string | null;
  job_title_id: string | null;
  job_title_hay_points: number | null;
  grade: string | null;
  salary: number | null;
  variable_salary: number | null;
  salary_range_percentage: number | null;
  performance_rating: number | null;
  benefits_value: number | null;
  short_term_incentive: number | null;
  long_term_incentive: number | null;
  has_system_access: boolean;
  unit: { id: string; name: string; code: string; type: string; description: string | null } | null;
  org_breadcrumb: string;
  org_label: string;
  user_roles: Array<{ role: string }>;
}

// Utility function to normalize labels
const normalizeLabel = (value?: string | null): string => {
  if (!value) return '';
  const s = value.replace(/\s+/g, ' ').trim();
  // If it's an acronym with letters separated by spaces (e.g., "R H"), join them
  if (/^(?:[A-Za-z]\s)+[A-Za-z]$/.test(s)) {
    return s.replace(/\s/g, '');
  }
  return s;
};

const Users = () => {
  const navigate = useNavigate();
  const { activeCompanyId, isLoading: companyContextLoading } = useCompanyContext();
  const { hasModule } = useModuleAccess();
  const hasCoreModule = hasModule('core');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inactivateUserId, setInactivateUserId] = useState<string | null>(null);
  const [reactivateUserId, setReactivateUserId] = useState<string | null>(null);
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  
  // Filtros e paginação
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [baseDataDate, setBaseDataDate] = useState<string>("");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"compact" | "detailed">("compact");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Seleção em lote para convites
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [confirmBulkInvite, setConfirmBulkInvite] = useState(false);

  useEffect(() => {
    if (companyContextLoading) return;

    checkUserPermissions();
    fetchProfiles();
    setSelectedEmployees(new Set());

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUserPermissions();
      }
    });

    return () => subscription.unsubscribe();
  }, [activeCompanyId, companyContextLoading]);

  useEffect(() => {
    if (profiles.length > 0) {
      const fetchBaseDate = async () => {
        let query = supabase
          .from("profiles")
          .select("updated_at")
          .not("employee_number", "is", null)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (activeCompanyId) {
          query = query.eq("root_company_id", activeCompanyId);
        }

        const { data } = await query.maybeSingle();
        
        if (data?.updated_at) {
          const date = new Date(data.updated_at);
          setBaseDataDate(format(date, "MM/yyyy", { locale: ptBR }));
        }
      };
      fetchBaseDate();
    }
  }, [profiles, activeCompanyId]);

  const checkUserPermissions = async () => {
    setPermissionsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setPermissionsLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    setCurrentUserRoles(roles?.map((r: any) => r.role) || []);
    setPermissionsLoading(false);
  };

  const hasPermission = () => {
    return currentUserRoles.includes("admin") || currentUserRoles.includes("hr_manager");
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      // CRITICAL: Primeiro obter o root_company_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        setLoading(false);
        return;
      }

      // Empresa ativa: usa o contexto do header quando disponível e,
      // como fallback seguro, a função do backend que respeita o override do super_admin.
      const { data: backendActiveCompanyId } = await supabase.rpc("get_user_company_id");
      const companyIdToUse = activeCompanyId || backendActiveCompanyId;

      // CRITICAL: Filtrar APENAS colaboradores da mesma empresa
      // e que tenham employee_number (são colaboradores reais, não apenas usuários)
      let query = supabase
        .from("profiles")
        .select("id, full_name, email, employee_number, phone, status, created_at, job_title, job_title_id, grade, salary, variable_salary, salary_range_percentage, performance_rating, benefits_value, short_term_incentive, long_term_incentive, has_system_access, unit:organizational_structure!profiles_position_id_fkey(id, name, code, type, description)")
        .not("employee_number", "is", null) // Exclui perfis sem número de registro
        .order("created_at", { ascending: false });

      // Filtrar pela empresa ativa no header; fallback para a empresa do usuário.
      if (companyIdToUse) {
        query = query.eq("root_company_id", companyIdToUse);
      } else {
        // Se usuário não tem empresa, não mostrar nenhum colaborador de outras empresas
        query = query.is("root_company_id", null).limit(0);
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Fetch hay_total_points for job titles
      const jobTitleIds = [...new Set((profilesData || []).map(p => p.job_title_id).filter(Boolean))];
      let hayPointsMap: Record<string, number> = {};
      if (jobTitleIds.length > 0) {
        const { data: jobTitlesData } = await supabase
          .from("job_titles")
          .select("id, hay_total_points")
          .in("id", jobTitleIds);
        
        if (jobTitlesData) {
          hayPointsMap = jobTitlesData.reduce((acc, jt) => {
            if (jt.hay_total_points) {
              acc[jt.id] = jt.hay_total_points;
            }
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Fetch roles and breadcrumb for each profile
      const profilesWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          // Buscar breadcrumb hierárquico
          let orgBreadcrumb = '';
          if (profile.unit?.id) {
            try {
              const { data: breadcrumbData } = await supabase.rpc('get_org_breadcrumb_friendly', { 
                entity_id: profile.unit.id 
              });
              orgBreadcrumb = breadcrumbData || profile.unit.description || profile.unit.code || profile.unit.name;
            } catch (error) {
              console.error("Error fetching breadcrumb:", error);
              orgBreadcrumb = profile.unit.description || profile.unit.code || profile.unit.name;
            }
          }

          // Generate org_label (just the unit description)
          const orgLabel = normalizeLabel(
            profile.unit?.description || profile.unit?.name || profile.unit?.code || ''
          );

          return {
            ...profile,
            has_system_access: profile.has_system_access ?? false,
            job_title_hay_points: profile.job_title_id ? hayPointsMap[profile.job_title_id] || null : null,
            user_roles: rolesData || [],
            org_breadcrumb: orgBreadcrumb,
            org_label: orgLabel,
          };
        })
      );

      setProfiles(profilesWithRoles);
    } catch (error: any) {
      toast.error("Erro ao carregar colaboradores");
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInactivateUser = async () => {
    if (!inactivateUserId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "inactive" })
        .eq("id", inactivateUserId);

      if (error) throw error;

      toast.success("Colaborador inativado com sucesso");
      fetchProfiles();
    } catch (error: any) {
      toast.error("Erro ao inativar colaborador");
      console.error(error);
    } finally {
      setInactivateUserId(null);
    }
  };

  const handleReactivateUser = async () => {
    if (!reactivateUserId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("id", reactivateUserId);

      if (error) throw error;

      toast.success("Colaborador reativado com sucesso");
      fetchProfiles();
    } catch (error: any) {
      toast.error("Erro ao reativar colaborador");
      console.error(error);
    } finally {
      setReactivateUserId(null);
    }
  };

  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
    setUserDialogOpen(true);
  };

  const handleNewUser = () => {
    setSelectedUserId(null);
    setUserDialogOpen(true);
  };

  // === FUNÇÕES DE ENVIO DE CONVITE ===
  const handleSendInvitation = async (employeeId: string, employeeName: string, hasAccess: boolean, hasEmail: boolean) => {
    if (!hasEmail) {
      toast.error(`${employeeName} não possui email cadastrado`);
      return;
    }

    if (!hasAccess) {
      toast.warning(`${employeeName} não tem "Acesso ao Sistema" habilitado. Deseja enviar mesmo assim?`, {
        action: {
          label: "Enviar mesmo assim",
          onClick: () => sendInvitationToEmployee(employeeId, employeeName, true)
        }
      });
      return;
    }

    await sendInvitationToEmployee(employeeId, employeeName, false);
  };

  const sendInvitationToEmployee = async (employeeId: string, employeeName: string, forceSend: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-employee-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          employee_ids: [employeeId],
          force_send: forceSend
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao enviar convite');
      }

      if (result.results.sent.length > 0) {
        toast.success(`Convite enviado para ${employeeName}`);
      } else if (result.results.skipped_no_email.length > 0) {
        toast.error(`${employeeName} não possui email cadastrado`);
      } else if (result.results.skipped_no_access.length > 0) {
        toast.warning(`${employeeName} não tem acesso ao sistema habilitado`);
      } else if (result.results.errors.length > 0) {
        toast.error(`Erro: ${result.results.errors[0].error}`);
      }
    } catch (error: any) {
      toast.error(`Erro ao enviar convite: ${error.message}`);
    }
  };

  const handleBulkInvitation = async () => {
    if (selectedEmployees.size === 0) {
      toast.error("Selecione pelo menos um colaborador");
      return;
    }

    setSendingInvitations(true);
    setConfirmBulkInvite(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-employee-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          employee_ids: Array.from(selectedEmployees),
          force_send: true // Em lote, força envio
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao enviar convites');
      }

      const { summary } = result;
      
      if (summary.sent > 0) {
        toast.success(`${summary.sent} convite(s) enviado(s) com sucesso!`);
      }
      if (summary.skipped_no_email > 0) {
        toast.warning(`${summary.skipped_no_email} colaborador(es) sem email foram ignorados`);
      }
      if (summary.errors > 0) {
        toast.error(`${summary.errors} erro(s) ao enviar convites`);
      }

      setSelectedEmployees(new Set());
    } catch (error: any) {
      toast.error(`Erro ao enviar convites: ${error.message}`);
    } finally {
      setSendingInvitations(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    const newSelection = new Set(selectedEmployees);
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId);
    } else {
      newSelection.add(employeeId);
    }
    setSelectedEmployees(newSelection);
  };

  const toggleSelectAll = (profiles: Profile[]) => {
    if (selectedEmployees.size === profiles.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(profiles.map(p => p.id)));
    }
  };

  // Função para formatar % da faixa com cores
  const formatSalaryRangePercentage = (percentage: number | null) => {
    if (percentage === null) return '-';
    
    // Formatar com 2 casas decimais e vírgula brasileira
    const absFormatted = Math.abs(percentage).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    // CASO 1: Abaixo da faixa (< 0%) - Vermelho com sinal negativo
    if (percentage < 0) {
      return (
        <span className="text-red-600 dark:text-red-400 font-bold">
          -{absFormatted}% ⚠️
        </span>
      );
    } 
    // CASO 2: Dentro da faixa (0% a 100%) - Verde SEM sinal
    else if (percentage >= 0 && percentage <= 100) {
      return (
        <span className="text-green-600 dark:text-green-400 font-semibold">
          {absFormatted}%
        </span>
      );
    } 
    // CASO 3: Acima da faixa (> 100%) - Azul com sinal positivo
    else {
      return (
        <span className="text-blue-600 dark:text-blue-400 font-bold">
          +{absFormatted}%
        </span>
      );
    }
  };

  // Filtros e paginação
  const filteredProfiles = profiles.filter((profile) => {
    const emailStr = profile.email || '';
    const matchesSearch = profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emailStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.employee_number && profile.employee_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (profile.org_breadcrumb && profile.org_breadcrumb.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (profile.org_label && profile.org_label.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === "all" || profile.status === filterStatus;
    const matchesGrade = filterGrade === "all" || profile.grade === filterGrade;
    const matchesUnit = filterUnit === "all" || profile.unit?.id === filterUnit;
    
    return matchesSearch && matchesStatus && matchesGrade && matchesUnit;
  });

  // Paginação
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Contadores para o botão de envio em lote (após paginatedProfiles estar definido)
  const selectedWithEmail = paginatedProfiles.filter(p => selectedEmployees.has(p.id) && p.email).length;
  const selectedWithoutAccess = paginatedProfiles.filter(p => selectedEmployees.has(p.id) && p.email && !p.has_system_access).length;

  // Resetar para página 1 quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterGrade, filterUnit]);

  // Obter valores únicos para filtros
  const uniqueGrades = Array.from(new Set(profiles.map(p => p.grade).filter(Boolean)));
  const uniqueUnits = Array.from(new Set(profiles.map(p => p.unit).filter(Boolean)));
  
  const totalProfiles = profiles.length;
  const activeProfiles = profiles.filter(p => p.status === "active").length;
  const inactiveProfiles = profiles.filter(p => p.status === "inactive").length;

  // Calcular SUBTOTAL da página atual
  const pageSubtotal = paginatedProfiles.reduce((acc, profile) => {
    const totalCash = (profile.salary || 0) + (profile.variable_salary || 0);
    const totalIncentives = (profile.short_term_incentive || 0) + (profile.long_term_incentive || 0);
    
    return {
      count: acc.count + 1,
      fixedSalary: acc.fixedSalary + (profile.salary || 0),
      variableSalary: acc.variableSalary + (profile.variable_salary || 0),
      totalCash: acc.totalCash + totalCash,
      benefits: acc.benefits + (profile.benefits_value || 0),
      incentives: acc.incentives + totalIncentives,
      totalCompensation: acc.totalCompensation + totalCash + (profile.benefits_value || 0) + totalIncentives,
    };
  }, {
    count: 0,
    fixedSalary: 0,
    variableSalary: 0,
    totalCash: 0,
    benefits: 0,
    incentives: 0,
    totalCompensation: 0,
  });

  // Calcular TOTAL GERAL de todos os funcionários filtrados
  const grandTotal = filteredProfiles.reduce((acc, profile) => {
    const totalCash = (profile.salary || 0) + (profile.variable_salary || 0);
    const totalIncentives = (profile.short_term_incentive || 0) + (profile.long_term_incentive || 0);
    
    return {
      count: acc.count + 1,
      fixedSalary: acc.fixedSalary + (profile.salary || 0),
      variableSalary: acc.variableSalary + (profile.variable_salary || 0),
      totalCash: acc.totalCash + totalCash,
      benefits: acc.benefits + (profile.benefits_value || 0),
      incentives: acc.incentives + totalIncentives,
      totalCompensation: acc.totalCompensation + totalCash + (profile.benefits_value || 0) + totalIncentives,
    };
  }, {
    count: 0,
    fixedSalary: 0,
    variableSalary: 0,
    totalCash: 0,
    benefits: 0,
    incentives: 0,
    totalCompensation: 0,
  });

  // Verificar se estamos na última página
  const isLastPage = currentPage === totalPages || totalPages <= 1;

  const getRoleBadge = (roles: Array<{ role: string }>) => {
    if (!roles || roles.length === 0) return null;
    
    const roleColors: Record<string, string> = {
      admin: "bg-destructive/10 text-destructive border-destructive/20",
      hr_manager: "bg-primary/10 text-primary border-primary/20",
      manager: "bg-warning/10 text-warning border-warning/20",
      employee: "bg-success/10 text-success border-success/20",
    };

    const roleLabels: Record<string, string> = {
      admin: "Admin",
      hr_manager: "Gestor RH",
      manager: "Gestor",
      employee: "Colaborador",
    };

    return roles.map((r, idx) => (
      <Badge key={idx} variant="outline" className={roleColors[r.role] || ""}>
        {roleLabels[r.role] || r.role}
      </Badge>
    ));
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 space-y-4">
            <p className="text-center text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
            <div className="flex justify-center">
              <Button variant="outline" onClick={checkUserPermissions}>Atualizar permissões</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Colaboradores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie informações de colaboradores, cargos e vínculos empregatícios
            {baseDataDate && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                Base: {baseDataDate}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Botão de Enviar Convites em Lote */}
          {selectedEmployees.size > 0 && (
            <Button 
              variant="default"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => setConfirmBulkInvite(true)}
              disabled={sendingInvitations || selectedWithEmail === 0}
            >
              {sendingInvitations ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar Convites ({selectedWithEmail})
              {selectedWithoutAccess > 0 && (
                <span className="ml-1 text-yellow-200 text-xs">
                  ⚠️ {selectedWithoutAccess} sem acesso
                </span>
              )}
            </Button>
          )}
          
          {hasCoreModule && (!isConsultorUser || hasConsultorCoreAccess) ? (
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setBulkImportOpen(true)}
            >
              <Upload className="w-4 h-4" />
              Atualizar Colaboradores
            </Button>
          ) : isConsultorUser && hasCoreModule ? (
            <Button
              variant="outline"
              className="gap-2"
              disabled
              title="Acesso restrito: é necessário um projeto de RH Service em andamento nesta empresa."
            >
              <Lock className="w-4 h-4" />
              Acesso restrito
            </Button>
          ) : (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/settings/plans')}
            >
              <Lock className="w-4 h-4" />
              Ativar módulo Core
            </Button>
          )}

          {(currentUserRoles.includes('manager') || currentUserRoles.includes('hr_manager') || currentUserRoles.includes('admin')) && (
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/budget-planning')}
            >
              <Calendar className="w-4 h-4" />
              Planejar Orçamento 2026
            </Button>
          )}
          <Button onClick={handleNewUser} className="bg-primary hover:bg-primary-hover gap-2 shadow-sm hover:shadow-md">
            <UserPlus className="w-4 h-4" />
            Novo Colaborador
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="transition-all hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Colaboradores
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <UsersIcon className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProfiles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastrados no sistema
            </p>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-lg hover:shadow-success/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Colaboradores Ativos
              </CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <UserCheck2 className="w-4 h-4 text-success" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {activeProfiles}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalProfiles > 0 ? `${((activeProfiles / totalProfiles) * 100).toFixed(0)}% do total` : '0% do total'}
            </p>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-lg hover:shadow-muted/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Colaboradores Inativos
              </CardTitle>
              <div className="p-2 rounded-lg bg-muted">
                <UserMinus className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              {inactiveProfiles}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalProfiles > 0 ? `${((inactiveProfiles / totalProfiles) * 100).toFixed(0)}% do total` : '0% do total'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, email ou número de registro (RE)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === "compact" ? "detailed" : "compact")}
                title={viewMode === "compact" ? "Modo Detalhado" : "Modo Compacto"}
              >
                {viewMode === "compact" ? <LayoutList className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Grades</SelectItem>
                  {uniqueGrades.map((grade) => (
                    <SelectItem key={grade} value={grade!}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  {uniqueUnits.map((unit) => (
                    <SelectItem key={unit!.id} value={unit!.id}>
                      {unit!.description || unit!.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Exibindo {paginatedProfiles.length} de {filteredProfiles.length} colaborador(es)
                {filteredProfiles.length !== totalProfiles && ` (${totalProfiles} total)`}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando colaboradores...
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum colaborador encontrado
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={selectedEmployees.size === paginatedProfiles.length && paginatedProfiles.length > 0}
                        onCheckedChange={() => toggleSelectAll(paginatedProfiles)}
                      />
                    </TableHead>
                    <TableHead className="w-[90px] text-xs"># Registro</TableHead>
                    <TableHead className="min-w-[180px] text-xs">Nome</TableHead>
                    <TableHead className="min-w-[120px] text-xs">Estrutura Org</TableHead>
                    <TableHead className="min-w-[130px] text-xs">Cargo</TableHead>
                    <TableHead className="w-[60px] text-xs text-center">Grade</TableHead>
                    <TableHead className="w-[50px] text-xs text-center">Pontos</TableHead>
                    <TableHead className="w-[100px] text-right text-xs">Fixo</TableHead>
                    <TableHead className="w-[100px] text-right text-xs">Variável</TableHead>
                    <TableHead className="w-[110px] text-right text-xs font-semibold">Total Cash</TableHead>
                    <TableHead className="w-[100px] text-right text-xs">Benefícios</TableHead>
                    <TableHead className="w-[100px] text-right text-xs">Incentivos</TableHead>
                    <TableHead className="w-[120px] text-right text-xs font-bold">Total Comp</TableHead>
                    <TableHead className="w-[80px] text-center text-xs">% Faixa</TableHead>
                    <TableHead className="w-[80px] text-xs">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProfiles.map((profile) => {
                    const totalCash = (profile.salary || 0) + (profile.variable_salary || 0);
                    const totalIncentives = (profile.short_term_incentive || 0) + (profile.long_term_incentive || 0);
                    const totalCompensation = totalCash + (profile.benefits_value || 0) + totalIncentives;

                    return (
                      <TableRow key={profile.id} className="hover:bg-muted/50 text-xs">
                        {/* Checkbox de seleção */}
                        <TableCell>
                          <Checkbox 
                            checked={selectedEmployees.has(profile.id)}
                            onCheckedChange={() => toggleEmployeeSelection(profile.id)}
                          />
                        </TableCell>
                        
                        {/* # Registro */}
                        <TableCell className="font-mono font-bold text-primary text-xs">
                          {profile.employee_number || '-'}
                        </TableCell>
                        
                        {/* Nome + Cargo/Grade no modo compacto */}
                        <TableCell className="font-medium text-xs">
                          <div>{profile.full_name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {profile.job_title || "-"} • {profile.grade || "-"}
                          </div>
                        </TableCell>
                        
                        {/* Estrutura Organizacional */}
                        <TableCell className="text-xs" title={profile.org_breadcrumb}>
                          {profile.org_label || 'Não vinculado'}
                        </TableCell>
                        
                        {/* Cargo */}
                        <TableCell className="text-xs">{profile.job_title || "-"}</TableCell>
                        
                        {/* Grade */}
                        <TableCell className="text-xs text-center font-semibold">
                          {profile.grade || "-"}
                        </TableCell>

                        {/* Pontos Hay */}
                        <TableCell className="text-xs text-center">
                          {profile.job_title_hay_points ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-[10px] px-1">
                              {profile.job_title_hay_points}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        
                        {/* Salário Fixo */}
                        <TableCell className="text-right text-xs">
                          <span className="text-muted-foreground">
                            {profile.salary 
                              ? formatCurrency(profile.salary)
                              : "-"}
                          </span>
                        </TableCell>
                        
                        {/* Variável */}
                        <TableCell className="text-right text-xs">
                          <span className="text-muted-foreground">
                            {profile.variable_salary 
                              ? formatCurrency(profile.variable_salary)
                              : "-"}
                          </span>
                        </TableCell>
                        
                        {/* Total Cash (destaque) */}
                        <TableCell className="text-right text-xs font-semibold bg-blue-50/50 dark:bg-blue-950/20">
                          <span className="text-blue-700 dark:text-blue-300">
                            {totalCash > 0 
                              ? formatCurrency(totalCash)
                              : "-"}
                          </span>
                        </TableCell>
                        
                        {/* Benefícios */}
                        <TableCell className="text-right text-xs">
                          <span className="text-green-700 dark:text-green-400">
                            {profile.benefits_value 
                              ? formatCurrency(profile.benefits_value)
                              : "-"}
                          </span>
                        </TableCell>
                        
                        {/* Incentivos */}
                        <TableCell className="text-right text-xs">
                          <span className="text-purple-700 dark:text-purple-400">
                            {totalIncentives > 0 
                              ? formatCurrency(totalIncentives)
                              : "-"}
                          </span>
                        </TableCell>
                        
                        {/* Total Compensation (maior destaque) */}
                        <TableCell className="text-right text-xs font-bold bg-primary/10">
                          <span className="text-primary text-sm">
                            {totalCompensation > 0 
                              ? formatCurrency(totalCompensation)
                              : "-"}
                          </span>
                        </TableCell>
                        
                        {/* % Faixa */}
                        <TableCell className="text-center text-xs">
                          {formatSalaryRangePercentage(profile.salary_range_percentage)}
                        </TableCell>
                        
                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              profile.status === "active"
                                ? "bg-success/10 text-success border-success/20 text-[10px] px-2 py-0"
                                : "bg-muted/50 text-muted-foreground text-[10px] px-2 py-0"
                            }
                          >
                            {profile.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        
                        {/* Ações */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(profile.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              
                              {/* Botão Enviar Convite Individual */}
                              <DropdownMenuItem 
                                onClick={() => handleSendInvitation(
                                  profile.id, 
                                  profile.full_name, 
                                  profile.has_system_access,
                                  !!profile.email
                                )}
                                className={profile.email ? "text-green-600" : "text-muted-foreground"}
                                disabled={!profile.email}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Enviar Convite
                                {!profile.email && (
                                  <span className="ml-1 text-xs">(sem email)</span>
                                )}
                                {profile.email && !profile.has_system_access && (
                                  <AlertCircle className="w-3 h-3 ml-1 text-yellow-500" />
                                )}
                              </DropdownMenuItem>
                              
                              {profile.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() => setInactivateUserId(profile.id)}
                                  className="text-destructive"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Inativar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setReactivateUserId(profile.id)}
                                  className="text-success"
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Reativar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* Linha de SUBTOTAL da página */}
                  {paginatedProfiles.length > 0 && (
                    <TableRow className="bg-muted/50 border-t border-border font-semibold">
                      <TableCell></TableCell>
                      <TableCell className="text-xs font-semibold">SUBTOTAL</TableCell>
                      <TableCell className="text-xs">{pageSubtotal.count} funcionário(s) nesta página</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-semibold">
                        {formatCurrency(pageSubtotal.fixedSalary)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-semibold">
                        {formatCurrency(pageSubtotal.variableSalary)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold bg-blue-50/50 dark:bg-blue-950/20">
                        <span className="text-blue-600 dark:text-blue-400">
                          {formatCurrency(pageSubtotal.totalCash)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        <span className="text-green-600 dark:text-green-400">
                          {formatCurrency(pageSubtotal.benefits)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        <span className="text-purple-600 dark:text-purple-400">
                          {formatCurrency(pageSubtotal.incentives)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold bg-primary/5">
                        <span className="text-primary">
                          {formatCurrency(pageSubtotal.totalCompensation)}
                        </span>
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}

                  {/* Linha de TOTAL GERAL - apenas na última página */}
                  {isLastPage && filteredProfiles.length > 0 && (
                    <TableRow className="bg-primary/10 border-t-2 border-primary/30 font-bold">
                      <TableCell></TableCell>
                      <TableCell className="text-xs font-bold text-primary">TOTAL GERAL</TableCell>
                      <TableCell className="text-xs font-bold">{grandTotal.count} funcionário(s)</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        {formatCurrency(grandTotal.fixedSalary)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        {formatCurrency(grandTotal.variableSalary)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold bg-blue-100/70 dark:bg-blue-950/40">
                        <span className="text-blue-700 dark:text-blue-300">
                          {formatCurrency(grandTotal.totalCash)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        <span className="text-green-700 dark:text-green-400">
                          {formatCurrency(grandTotal.benefits)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        <span className="text-purple-700 dark:text-purple-400">
                          {formatCurrency(grandTotal.incentives)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold bg-primary/15">
                        <span className="text-primary text-sm">
                          {formatCurrency(grandTotal.totalCompensation)}
                        </span>
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <CardContent className="pt-0">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        )}
      </Card>

      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        userId={selectedUserId}
        onSuccess={fetchProfiles}
      />

      <EmployeeBulkImport
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onSuccess={fetchProfiles}
      />

      <AlertDialog open={!!inactivateUserId} onOpenChange={() => setInactivateUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Inativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja inativar este colaborador? Ele não poderá mais acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleInactivateUser} className="bg-destructive hover:bg-destructive/90">
              Inativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!reactivateUserId} onOpenChange={() => setReactivateUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reativar este colaborador? Ele poderá acessar o sistema novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReactivateUser} className="bg-success hover:bg-success/90">
              Reativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de Envio em Lote */}
      <AlertDialog open={confirmBulkInvite} onOpenChange={setConfirmBulkInvite}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Confirmar Envio de Convites
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a enviar convites por email para <strong>{selectedWithEmail}</strong> colaborador(es).
              </p>
              {selectedWithoutAccess > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-yellow-800 dark:text-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Atenção:</span>
                  </div>
                  <p className="text-sm mt-1">
                    {selectedWithoutAccess} colaborador(es) selecionado(s) não possuem "Acesso ao Sistema" habilitado. 
                    O convite será enviado mesmo assim.
                  </p>
                </div>
              )}
              <p className="text-sm">
                Cada colaborador receberá um email com link para definir sua senha e acessar o sistema.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkInvitation}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar {selectedWithEmail} Convite(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
