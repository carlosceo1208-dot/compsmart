import { useState, useEffect } from "react";
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
import { 
  Search, UserPlus, Calendar, MoreVertical, Edit, UserX, Upload, UserCheck, Loader2,
  Users as UsersIcon, UserCheck2, UserMinus, LayoutGrid, LayoutList, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserDialog } from "@/components/UserDialog";
import { EmployeeBulkImport } from "@/components/EmployeeBulkImport";
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
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  job_title: string | null;
  grade: string | null;
  salary: number | null;
  variable_salary: number | null;
  salary_range_percentage: number | null;
  performance_rating: number | null;
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

  useEffect(() => {
    checkUserPermissions();
    fetchProfiles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUserPermissions();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (profiles.length > 0) {
      const fetchBaseDate = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data?.updated_at) {
          const date = new Date(data.updated_at);
          setBaseDataDate(format(date, "MM/yyyy", { locale: ptBR }));
        }
      };
      fetchBaseDate();
    }
  }, [profiles]);

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
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, status, created_at, job_title, grade, salary, variable_salary, salary_range_percentage, performance_rating, unit:unit_id(id, name, code, type, description)")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

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
            user_roles: rolesData || [],
            org_breadcrumb: orgBreadcrumb,
            org_label: orgLabel,
          };
        })
      );

      setProfiles(profilesWithRoles);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários");
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

      toast.success("Usuário inativado com sucesso");
      fetchProfiles();
    } catch (error: any) {
      toast.error("Erro ao inativar usuário");
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

      toast.success("Usuário reativado com sucesso");
      fetchProfiles();
    } catch (error: any) {
      toast.error("Erro ao reativar usuário");
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

  // Filtros e paginação
  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch = profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <h1 className="text-3xl font-bold">Gestão de Funcionários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie informações de funcionários, cargos e vínculos empregatícios
            {baseDataDate && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                Base: {baseDataDate}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setBulkImportOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Atualizar Funcionários
          </Button>
          <Button onClick={handleNewUser} className="bg-primary hover:bg-primary-hover gap-2 shadow-sm hover:shadow-md">
            <UserPlus className="w-4 h-4" />
            Novo Funcionário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="transition-all hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Usuários
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
                Usuários Ativos
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
                Usuários Inativos
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
                  placeholder="Buscar por nome ou email..."
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
                Exibindo {paginatedProfiles.length} de {filteredProfiles.length} usuário(s)
                {filteredProfiles.length !== totalProfiles && ` (${totalProfiles} total)`}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando usuários...
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead># Registro</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Estrutura Organizacional</TableHead>
                    {viewMode === "detailed" && (
                      <>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Salário Fixo (R$)</TableHead>
                        <TableHead>Salário Variável (R$)</TableHead>
                      </>
                    )}
                    <TableHead>Total Cash (R$)</TableHead>
                    {viewMode === "detailed" && (
                      <>
                        <TableHead>% Faixa</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Perfil</TableHead>
                      </>
                    )}
                    <TableHead>Status</TableHead>
                    {viewMode === "detailed" && <TableHead>Data de Admissão</TableHead>}
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProfiles.map((profile, index) => (
                    <TableRow key={profile.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm text-muted-foreground">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{profile.full_name}</div>
                          {viewMode === "compact" && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {profile.job_title || "-"} • {profile.grade || "-"}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span 
                          className="text-sm" 
                          title={profile.org_breadcrumb || undefined}
                        >
                          {profile.org_label || 'Não vinculado'}
                        </span>
                      </TableCell>
                      {viewMode === "detailed" && (
                        <>
                          <TableCell>
                            <span className="text-sm">{profile.job_title || "-"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{profile.grade || "-"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {profile.salary 
                                ? profile.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {profile.variable_salary 
                                ? profile.variable_salary.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : "-"}
                            </span>
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <span className="text-sm font-bold">
                          {(profile.salary || profile.variable_salary)
                            ? ((profile.salary || 0) + (profile.variable_salary || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : "-"}
                        </span>
                      </TableCell>
                      {viewMode === "detailed" && (
                        <>
                          <TableCell>
                            <span className="text-sm">
                              {profile.salary_range_percentage 
                                ? `${profile.salary_range_percentage.toFixed(1)}%` 
                                : "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {profile.performance_rating 
                                ? profile.performance_rating.toFixed(1) 
                                : "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {getRoleBadge(profile.user_roles)}
                            </div>
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            profile.status === "active"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-muted/50 text-muted-foreground"
                          }
                        >
                          {profile.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      {viewMode === "detailed" && (
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(profile.created_at), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(profile.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
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
                  ))}
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
              Tem certeza que deseja inativar este usuário? Ele não poderá mais acessar o sistema.
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
              Tem certeza que deseja reativar este usuário? Ele poderá acessar o sistema novamente.
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
    </div>
  );
};

export default Users;
