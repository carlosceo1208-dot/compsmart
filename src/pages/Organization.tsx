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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, MoreVertical, Edit, Trash2, Building2, Loader2, Network } from "lucide-react";
import { toast } from "sonner";
import { OrganizationDialog } from "@/components/OrganizationDialog";
import { OrganizationTree } from "@/components/OrganizationTree";

interface OrgEntity {
  id: string;
  name: string;
  code: string | null;
  type: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  parent?: { name: string } | null;
  fantasy_name?: string | null;
  cnpj?: string | null;
  address?: string | null;
  union_name?: string | null;
  base_date?: string | null;
  root_company_id?: string | null;
}

interface Company {
  id: string;
  name: string;
  fantasy_name?: string | null;
  cnpj?: string | null;
}

const Organization = () => {
  const [entities, setEntities] = useState<OrgEntity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [deleteEntityId, setDeleteEntityId] = useState<string | null>(null);
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    checkUserPermissions();
    fetchCompanies();
    fetchEntities();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUserPermissions();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [selectedCompanyId]);

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

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("organizational_structure")
        .select("id, name, fantasy_name, cnpj")
        .eq("type", "company")
        .order("name", { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar empresas");
      console.error("Error fetching companies:", error);
    }
  };

  const fetchEntities = async () => {
    try {
      let query = supabase
        .from("organizational_structure")
        .select("*");

      // Filtrar por empresa selecionada
      if (selectedCompanyId !== "all") {
        query = query.eq("root_company_id", selectedCompanyId);
      }

      const { data, error } = await query
        .order("code", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (error) throw error;
      
      // Fetch parent names separately for each entity
      const entitiesWithParents = await Promise.all(
        (data || []).map(async (entity) => {
          if (entity.parent_id) {
            const { data: parentData } = await supabase
              .from("organizational_structure")
              .select("name")
              .eq("id", entity.parent_id)
              .single();
            
            return {
              ...entity,
              parent: parentData ? { name: parentData.name } : null
            };
          }
          return { ...entity, parent: null };
        })
      );
      
      setEntities(entitiesWithParents);
    } catch (error: any) {
      toast.error("Erro ao carregar estrutura organizacional");
      console.error("Error fetching entities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntity = async () => {
    if (!deleteEntityId) return;

    try {
      // Check if entity has children
      const { data: children } = await supabase
        .from("organizational_structure")
        .select("id")
        .eq("parent_id", deleteEntityId);

      if (children && children.length > 0) {
        toast.error("Não é possível excluir uma entidade que possui filhos. Reatribua ou exclua os filhos primeiro.");
        setDeleteEntityId(null);
        return;
      }

      const { error } = await supabase
        .from("organizational_structure")
        .delete()
        .eq("id", deleteEntityId);

      if (error) throw error;

      toast.success("Entidade excluída com sucesso");
      fetchEntities();
    } catch (error: any) {
      toast.error("Erro ao excluir entidade");
      console.error(error);
    } finally {
      setDeleteEntityId(null);
    }
  };

  const handleEditEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
    setDialogOpen(true);
  };

  const handleNewEntity = () => {
    setSelectedEntityId(null);
    setDialogOpen(true);
  };

  const filteredEntities = entities.filter((entity) =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      company: "bg-primary/10 text-primary border-primary/20",
      headquarters: "bg-primary/10 text-primary border-primary/20",
      branch: "bg-info/10 text-info border-info/20",
      area: "bg-warning/10 text-warning border-warning/20",
      department: "bg-success/10 text-success border-success/20",
      sector: "bg-accent/10 text-accent-foreground border-accent/20",
      project: "bg-muted text-muted-foreground border-muted",
    };

    const typeLabels: Record<string, string> = {
      company: "Empresa",
      headquarters: "Matriz",
      branch: "Filial",
      area: "Área",
      department: "Departamento",
      sector: "Setor",
      project: "Projeto",
    };

    return (
      <Badge variant="outline" className={typeColors[type] || ""}>
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const getStats = () => {
    return {
      total: entities.length,
      companies: entities.filter(e => e.type === 'company').length,
      headquarters: entities.filter(e => e.type === 'headquarters').length,
      branches: entities.filter(e => e.type === 'branch').length,
      areas: entities.filter(e => e.type === 'area').length,
      departments: entities.filter(e => e.type === 'department').length,
      sectors: entities.filter(e => e.type === 'sector').length,
      projects: entities.filter(e => e.type === 'project').length,
    };
  };

  const stats = getStats();

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
          <h1 className="text-3xl font-bold">Estrutura Organizacional</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a hierarquia organizacional da empresa
          </p>
        </div>
        <Button onClick={handleNewEntity} className="bg-gradient-primary hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />
          Nova Entidade
        </Button>
      </div>

      {/* Company Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Selecionar Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Todas as Empresas</span>
                </div>
              </SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {company.fantasy_name || company.name}
                      </span>
                      {company.fantasy_name && (
                        <span className="text-xs text-muted-foreground">
                          ({company.name})
                        </span>
                      )}
                    </div>
                    {company.cnpj && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {company.cnpj}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.companies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matrizes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.headquarters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filiais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.branches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Áreas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.areas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Departamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.departments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Setores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-foreground">{stats.sectors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.projects}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <Building2 className="w-4 h-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="tree" className="gap-2">
            <Network className="w-4 h-4" />
            Organograma
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, código ou tipo..."
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
                  Carregando estrutura organizacional...
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma entidade encontrada
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntities.map((entity) => (
                       <TableRow key={entity.id} className="hover:bg-muted/50">
                          <TableCell>
                            <span className="font-mono font-semibold text-base">
                              {entity.code || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(entity.type)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <span className="font-medium">{entity.name}</span>
                              {entity.description && (
                                <p className="text-xs text-muted-foreground">
                                  {entity.description}
                                </p>
                              )}
                              {entity.fantasy_name && (
                                <p className="text-xs text-muted-foreground">
                                  Nome Fantasia: {entity.fantasy_name}
                                </p>
                              )}
                              {entity.cnpj && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  CNPJ: {entity.cnpj}
                                </p>
                              )}
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
                                <DropdownMenuItem onClick={() => handleEditEntity(entity.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteEntityId(entity.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
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
        </TabsContent>

        <TabsContent value="tree" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organograma Hierárquico</CardTitle>
            </CardHeader>
            <CardContent>
              <OrganizationTree entities={entities} onEdit={handleEditEntity} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <OrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityId={selectedEntityId}
        onSuccess={fetchEntities}
      />

      <AlertDialog open={!!deleteEntityId} onOpenChange={() => setDeleteEntityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta entidade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntity} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Organization;
