import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Loader2, Save, Crown } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string | null;
}

interface RolePermission {
  role: Database["public"]["Enums"]["app_role"];
  permission_id: string;
}

const roleInfo = {
  super_admin: {
    label: "Super Administrador",
    description: "Acesso global à plataforma CompSmart, gerencia templates, landing page e configurações do sistema",
    color: "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
    icon: "crown",
  },
  admin: {
    label: "Administrador",
    description: "Acesso total ao sistema da empresa, incluindo gestão de usuários e configurações",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: "shield",
  },
  hr_manager: {
    label: "Gestor de RH",
    description: "Gerencia usuários, estrutura organizacional e dados de remuneração",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: "shield",
  },
  manager: {
    label: "Gestor",
    description: "Visualiza e gerencia dados de sua equipe",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: "shield",
  },
  employee: {
    label: "Colaborador",
    description: "Acesso limitado aos próprios dados",
    color: "bg-success/10 text-success border-success/20",
    icon: "shield",
  },
};

const Roles = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    checkUserPermissions();
    fetchData();
  }, []);

  const checkUserPermissions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    setCurrentUserRoles(roles?.map((r: any) => r.role) || []);
  };

  const isAdminOrSuperAdmin = () => currentUserRoles.includes("admin") || currentUserRoles.includes("super_admin");

  const fetchData = async () => {
    try {
      const [permissionsResponse, rolePermissionsResponse] = await Promise.all([
        supabase.from("permissions").select("*").order("name"),
        supabase.from("role_permissions").select("*"),
      ]);

      if (permissionsResponse.error) throw permissionsResponse.error;
      if (rolePermissionsResponse.error) throw rolePermissionsResponse.error;

      setPermissions(permissionsResponse.data || []);
      setRolePermissions(rolePermissionsResponse.data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role: string, permissionId: string) => {
    return rolePermissions.some(
      (rp) => rp.role === role && rp.permission_id === permissionId
    );
  };

  const togglePermission = (role: string, permissionId: string) => {
    if (!isAdminOrSuperAdmin()) return;

    setHasChanges(true);
    const exists = hasPermission(role, permissionId);

    if (exists) {
      setRolePermissions(
        rolePermissions.filter(
          (rp) => !(rp.role === role && rp.permission_id === permissionId)
        )
      );
    } else {
      setRolePermissions([...rolePermissions, { role: role as Database["public"]["Enums"]["app_role"], permission_id: permissionId }]);
    }
  };

  const handleSave = async () => {
    if (!isAdminOrSuperAdmin()) {
      toast.error("Você não tem permissão para salvar alterações");
      return;
    }

    setSaving(true);
    try {
      // Delete all existing role_permissions using gt to match all UUIDs
      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .gt("id", "00000000-0000-0000-0000-000000000000");

      if (deleteError) throw deleteError;

      // Insert new role_permissions
      if (rolePermissions.length > 0) {
        const { error: insertError } = await supabase
          .from("role_permissions")
          .insert(rolePermissions);

        if (insertError) throw insertError;
      }

      toast.success("Permissões atualizadas com sucesso!");
      setHasChanges(false);
    } catch (error: any) {
      toast.error("Erro ao salvar permissões");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdminOrSuperAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar perfis e permissões.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Perfis e Permissões</h1>
          <p className="text-muted-foreground mt-1">
            Configure permissões de acesso para cada perfil do sistema
          </p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-primary hover:opacity-90 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        )}
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(roleInfo).map(([role, info]) => (
          <Card key={role}>
            <CardHeader>
                <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${role === 'super_admin' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20' : 'bg-primary/10'}`}>
                    {role === 'super_admin' ? (
                      <Crown className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Shield className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{info.label}</CardTitle>
                    <CardDescription className="mt-1">
                      {info.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={info.color}>
                  {role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Permissões</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start space-x-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`${role}-${permission.id}`}
                        checked={hasPermission(role, permission.id)}
                        onCheckedChange={() => togglePermission(role, permission.id)}
                        disabled={!isAdminOrSuperAdmin()}
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`${role}-${permission.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {permission.name}
                        </Label>
                        {permission.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Sobre Permissões</p>
              <p className="text-sm text-muted-foreground">
                As permissões controlam o que cada perfil pode fazer no sistema. Marque as
                caixas para conceder acesso a funcionalidades específicas. As alterações só
                serão aplicadas após salvar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Roles;
