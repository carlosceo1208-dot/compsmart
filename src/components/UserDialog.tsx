import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const userSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  birth_date: z.string().optional(),
});

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string | null;
  onSuccess: () => void;
}

interface UserData {
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  roles: string[];
}

const roleOptions = [
  { value: "admin", label: "Administrador" },
  { value: "hr_manager", label: "Gestor de RH" },
  { value: "manager", label: "Gestor" },
  { value: "employee", label: "Colaborador" },
];

export const UserDialog = ({ open, onOpenChange, userId, onSuccess }: UserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    birth_date: "",
    roles: ["employee"],
  });

  useEffect(() => {
    if (userId && open) {
      fetchUserData();
    } else if (!open) {
      resetForm();
    }
  }, [userId, open]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, phone, cpf, birth_date")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      setFormData({
        ...profile,
        password: "",
        roles: userRoles.map((r: any) => r.role),
      });
    } catch (error: any) {
      toast.error("Erro ao carregar dados do usuário");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      cpf: "",
      birth_date: "",
      roles: ["employee"],
    });
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (userId) {
        // Update existing user
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            cpf: formData.cpf || null,
            birth_date: formData.birth_date || null,
          })
          .eq("id", userId);

        if (updateError) throw updateError;

        // Update roles
        await supabase.from("user_roles").delete().eq("user_id", userId);
        
        const roleInserts = formData.roles.map(role => ({
          user_id: userId,
          role: role as "admin" | "hr_manager" | "manager" | "employee",
        }));
        
        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(roleInserts);

        if (rolesError) throw rolesError;

        toast.success("Usuário atualizado com sucesso!");
      } else {
        // Create new user
        const validation = userSchema.parse(formData);

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: validation.email,
          password: validation.password!,
          options: {
            data: {
              full_name: validation.full_name,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Falha ao criar usuário");

        // Update profile with additional info
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            phone: formData.phone || null,
            cpf: formData.cpf || null,
            birth_date: formData.birth_date || null,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        // Assign roles
        await supabase.from("user_roles").delete().eq("user_id", authData.user.id);
        
        const roleInserts = formData.roles.map(role => ({
          user_id: authData.user.id,
          role: role as "admin" | "hr_manager" | "manager" | "employee",
        }));
        
        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(roleInserts);

        if (rolesError) throw rolesError;

        toast.success("Usuário criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Erro ao salvar usuário");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{userId ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          <DialogDescription>
            {userId ? "Atualize as informações do usuário e suas permissões" : "Preencha os dados para criar um novo usuário"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading || !!userId}
              />
            </div>
            {!userId && (
              <div className="col-span-2 space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!userId}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Perfis de Acesso *</Label>
            <div className="space-y-2">
              {roleOptions.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.value}
                    checked={formData.roles.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                    disabled={loading}
                  />
                  <Label htmlFor={role.value} className="font-normal cursor-pointer">
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || formData.roles.length === 0}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                userId ? "Atualizar" : "Criar Usuário"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
