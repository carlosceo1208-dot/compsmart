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
import { Search, UserPlus, Mail, Calendar, MoreVertical, Edit, UserX, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserDialog } from "@/components/UserDialog";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  user_roles: Array<{ role: string }>;
}

const Users = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inactivateUserId, setInactivateUserId] = useState<string | null>(null);
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);

  useEffect(() => {
    checkUserPermissions();
    fetchProfiles();
  }, []);

  const checkUserPermissions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    setCurrentUserRoles(roles?.map(r => r.role) || []);
  };

  const hasPermission = () => {
    return currentUserRoles.includes("admin") || currentUserRoles.includes("hr_manager");
  };

  const fetchProfiles = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, status, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles separately for each profile
      const profilesWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          return {
            ...profile,
            user_roles: rolesData || [],
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

  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
    setUserDialogOpen(true);
  };

  const handleNewUser = () => {
    setSelectedUserId(null);
    setUserDialogOpen(true);
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários, perfis e permissões do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Atualizar Funcionários
          </Button>
          <Button onClick={handleNewUser} className="bg-gradient-primary hover:opacity-90 gap-2">
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {profiles.filter(p => p.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              {profiles.filter(p => p.status === "inactive").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {profile.full_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {profile.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {getRoleBadge(profile.user_roles)}
                        </div>
                      </TableCell>
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
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(profile.created_at), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                      </TableCell>
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
                            {profile.status === "active" && (
                              <DropdownMenuItem
                                onClick={() => setInactivateUserId(profile.id)}
                                className="text-destructive"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Inativar
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
      </Card>

      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        userId={selectedUserId}
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
    </div>
  );
};

export default Users;
