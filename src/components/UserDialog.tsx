import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";
import { Loader2, ChevronsUpDown } from "lucide-react";
import { z } from "zod";

const userSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").optional(),
  phone: z.string().optional(),
  cpf: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      // Valida formato: apenas dígitos (11) ou formato xxx.xxx.xxx-xx
      return /^\d{11}$/.test(val) || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val);
    }, { message: "CPF deve ter 11 dígitos (xxxxxxxxxxx) ou formato xxx.xxx.xxx-xx" }),
  birth_date: z.string().optional(),
  job_title: z.string().optional(),
  grade: z.string().optional(),
  salary: z.string().optional(),
  variable_salary: z.string().optional(),
  salary_range_percentage: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const num = parseFloat(val);
      return num >= 0 && num <= 100;
    }, { message: "Porcentagem deve estar entre 0 e 100" }),
  performance_rating: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const num = parseFloat(val);
      return num >= 0 && num <= 10;
    }, { message: "Nota deve estar entre 0 e 10" }),
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
  job_title?: string;
  grade?: string;
  salary?: string;
  variable_salary?: string;
  salary_range_percentage?: string;
  performance_rating?: string;
  unit_id?: string;
  manager_id?: string;
  job_title_id?: string;
  roles: string[];
}

interface JobTitle {
  id: string;
  code: string;
  title: string;
  grade: string;
  median_points: number;
}

const roleOptions = [
  { value: "admin", label: "Administrador" },
  { value: "hr_manager", label: "Gestor de RH" },
  { value: "manager", label: "Gestor" },
  { value: "employee", label: "Colaborador" },
];

export const UserDialog = ({ open, onOpenChange, userId, onSuccess }: UserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [openUnits, setOpenUnits] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    birth_date: "",
    job_title: "",
    grade: "",
    salary: "",
    variable_salary: "",
    salary_range_percentage: "",
    performance_rating: "",
    unit_id: "",
    manager_id: "",
    job_title_id: "",
    roles: ["employee"],
  });
  const [positions, setPositions] = useState<Array<{ id: string; name: string; code: string; type: string; description: string | null }>>([]);
  const [managers, setManagers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState<JobTitle | null>(null);
  const [selectedUnitBreadcrumb, setSelectedUnitBreadcrumb] = useState("");
  const [loadingBreadcrumb, setLoadingBreadcrumb] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPositions();
      fetchManagers();
      fetchJobTitles();
      if (userId) {
        fetchUserData();
      } else {
        resetForm();
      }
    }
  }, [userId, open]);

  useEffect(() => {
    if (formData.job_title_id) {
      const jobTitle = jobTitles.find(jt => jt.id === formData.job_title_id);
      setSelectedJobTitle(jobTitle || null);
    } else {
      setSelectedJobTitle(null);
    }
  }, [formData.job_title_id, jobTitles]);

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from("organizational_structure")
        .select("id, name, code, type, description")
        .in("type", ["area", "department", "sector", "project"])
        .order("type", { ascending: true })
        .order("code", { ascending: true, nullsFirst: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setPositions(data || []);
    } catch (error: any) {
      console.error("Error fetching positions:", error);
    }
  };

  const fetchJobTitles = async () => {
    try {
      const { data, error } = await supabase
        .from("job_titles")
        .select("id, code, title, grade, median_points")
        .order("title", { ascending: true });

      if (error) throw error;
      setJobTitles(data || []);
    } catch (error: any) {
      console.error("Error fetching job titles:", error);
    }
  };

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("status", "active")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setManagers(data || []);
    } catch (error: any) {
      console.error("Error fetching managers:", error);
    }
  };

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, phone, cpf, birth_date, job_title, grade, salary, variable_salary, salary_range_percentage, performance_rating, unit_id, manager_id, job_title_id")
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
        salary: profile.salary 
          ? profile.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "",
        variable_salary: profile.variable_salary 
          ? profile.variable_salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "",
        salary_range_percentage: profile.salary_range_percentage?.toString() || "",
        performance_rating: profile.performance_rating?.toString() || "",
        unit_id: profile.unit_id || "",
        manager_id: profile.manager_id || "",
        job_title_id: profile.job_title_id || "",
        roles: userRoles.map((r: any) => r.role),
      });

      // Buscar breadcrumb se tiver unit_id
      if (profile.unit_id) {
        const { data: breadcrumbData } = await supabase.rpc('get_org_breadcrumb', { 
          entity_id: profile.unit_id 
        });
        setSelectedUnitBreadcrumb(breadcrumbData || '');
      }
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
      job_title: "",
      grade: "",
      salary: "",
      variable_salary: "",
      salary_range_percentage: "",
      performance_rating: "",
      unit_id: "",
      manager_id: "",
      job_title_id: "",
      roles: ["employee"],
    });
    setSelectedUnitBreadcrumb("");
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleUnitChange = async (unitId: string) => {
    setFormData({ ...formData, unit_id: unitId });
    
    if (unitId) {
      setLoadingBreadcrumb(true);
      try {
        const { data } = await supabase.rpc('get_org_breadcrumb', { entity_id: unitId });
        setSelectedUnitBreadcrumb(data || '');
      } catch (error) {
        console.error("Error fetching breadcrumb:", error);
      } finally {
        setLoadingBreadcrumb(false);
      }
    } else {
      setSelectedUnitBreadcrumb('');
    }
  };

  // Helper maps and grouping for ComboBox
  const typeLabelMap: Record<string, string> = {
    area: "Área",
    department: "Departamento",
    sector: "Setor",
    project: "Projeto",
  };

  const grouped = {
    area: [] as typeof positions,
    department: [] as typeof positions,
    sector: [] as typeof positions,
    project: [] as typeof positions,
  };
  
  positions.forEach((p) => {
    if (grouped[p.type as keyof typeof grouped]) {
      grouped[p.type as keyof typeof grouped].push(p);
    }
  });

  const selectedUnit = positions.find(p => p.id === formData.unit_id) || null;
  const selectedUnitLabel = selectedUnit
    ? `${selectedUnit.code ? `${selectedUnit.code} - ` : ""}${selectedUnit.description || selectedUnit.name}`
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Helper function to parse Brazilian currency format to number
      const parseBRCurrency = (value: string | undefined): number | null => {
        if (!value) return null;
        // Remove dots (thousand separators) and replace comma with dot
        const cleaned = value.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      };

      if (userId) {
        // Update existing user
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            cpf: formData.cpf || null,
            birth_date: formData.birth_date || null,
            job_title: formData.job_title || null,
            grade: formData.grade || null,
            salary: parseBRCurrency(formData.salary),
            variable_salary: parseBRCurrency(formData.variable_salary),
            salary_range_percentage: formData.salary_range_percentage ? parseFloat(formData.salary_range_percentage) : null,
            performance_rating: formData.performance_rating ? parseFloat(formData.performance_rating) : null,
            unit_id: formData.unit_id || null,
            manager_id: formData.manager_id || null,
            job_title_id: formData.job_title_id || null,
          })
          .eq("id", userId);

        if (updateError) throw updateError;

        // Update roles using secure function
        const { error: rolesError } = await supabase.rpc('manage_user_roles', {
          p_user_id: userId,
          p_roles: formData.roles as Database["public"]["Enums"]["app_role"][]
        });

        if (rolesError) throw rolesError;

        if (!formData.unit_id) {
          toast.info("Usuário atualizado sem vínculo organizacional. Você pode vincular a um Setor/Projeto depois em Editar Usuário ou na Estrutura Organizacional.");
        } else {
          toast.success("Usuário atualizado com sucesso!");
        }
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
            job_title: formData.job_title || null,
            grade: formData.grade || null,
            salary: parseBRCurrency(formData.salary),
            variable_salary: parseBRCurrency(formData.variable_salary),
            salary_range_percentage: formData.salary_range_percentage ? parseFloat(formData.salary_range_percentage) : null,
            performance_rating: formData.performance_rating ? parseFloat(formData.performance_rating) : null,
            unit_id: formData.unit_id || null,
            manager_id: formData.manager_id || null,
            job_title_id: formData.job_title_id || null,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        // Assign roles using secure function
        const { error: rolesError } = await supabase.rpc('manage_user_roles', {
          p_user_id: authData.user.id,
          p_roles: formData.roles as Database["public"]["Enums"]["app_role"][]
        });

        if (rolesError) throw rolesError;

        if (!formData.unit_id) {
          toast.info("Usuário criado sem vínculo organizacional. Você pode vincular a uma Área/Departamento/Setor/Projeto depois em Editar Usuário ou na Estrutura Organizacional.");
        } else {
          toast.success("Usuário criado com sucesso!");
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.message?.includes('deve ser um')) {
        toast.error("A unidade selecionada deve ser uma Área, Departamento, Setor ou Projeto válido");
      } else if (error.code === '23503') {
        toast.error("Unidade organizacional não encontrada. Ela pode ter sido excluída.");
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

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Informações de Cargo e Remuneração</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title">Título do Cargo</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  disabled={loading}
                  placeholder="Ex: Analista de RH"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  disabled={loading}
                  placeholder="Ex: A1, B2, C3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salário Fixo (R$)</Label>
                <Input
                  id="salary"
                  type="text"
                  value={formData.salary}
                  onChange={(e) => {
                    // Remove tudo exceto números e vírgula
                    let value = e.target.value.replace(/[^\d,]/g, '');
                    // Permite apenas uma vírgula
                    const parts = value.split(',');
                    if (parts.length > 2) {
                      value = parts[0] + ',' + parts.slice(1).join('');
                    }
                    setFormData({ ...formData, salary: value });
                  }}
                  onBlur={(e) => {
                    // Formata o valor ao sair do campo
                    const value = e.target.value.replace(/[^\d,]/g, '');
                    if (value) {
                      const numericValue = parseFloat(value.replace(',', '.'));
                      if (!isNaN(numericValue)) {
                        const formatted = numericValue.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                        setFormData({ ...formData, salary: formatted });
                      }
                    }
                  }}
                  disabled={loading}
                  placeholder="Ex: 20.000,00"
                />
                <p className="text-xs text-muted-foreground">
                  Use vírgula para centavos (Ex: 20000,00)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variable_salary">Salário Variável (R$)</Label>
                <Input
                  id="variable_salary"
                  type="text"
                  value={formData.variable_salary}
                  onChange={(e) => {
                    // Remove tudo exceto números e vírgula
                    let value = e.target.value.replace(/[^\d,]/g, '');
                    // Permite apenas uma vírgula
                    const parts = value.split(',');
                    if (parts.length > 2) {
                      value = parts[0] + ',' + parts.slice(1).join('');
                    }
                    setFormData({ ...formData, variable_salary: value });
                  }}
                  onBlur={(e) => {
                    // Formata o valor ao sair do campo
                    const value = e.target.value.replace(/[^\d,]/g, '');
                    if (value) {
                      const numericValue = parseFloat(value.replace(',', '.'));
                      if (!isNaN(numericValue)) {
                        const formatted = numericValue.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                        setFormData({ ...formData, variable_salary: formatted });
                      }
                    }
                  }}
                  disabled={loading}
                  placeholder="Ex: 5.000,00"
                />
                <p className="text-xs text-muted-foreground">
                  Use vírgula para centavos (Ex: 5000,00)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_range_percentage">% da Faixa</Label>
                <Input
                  id="salary_range_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.salary_range_percentage}
                  onChange={(e) => setFormData({ ...formData, salary_range_percentage: e.target.value })}
                  disabled={loading}
                  placeholder="0-100%"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performance_rating">Nota Avaliação de Desempenho</Label>
                <Input
                  id="performance_rating"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.performance_rating}
                  onChange={(e) => setFormData({ ...formData, performance_rating: e.target.value })}
                  disabled={loading}
                  placeholder="0.00 - 10.00"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Vínculo Organizacional</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_id">Unidade Organizacional</Label>
                <Popover open={openUnits} onOpenChange={setOpenUnits}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openUnits}
                      className="w-full justify-between"
                      type="button"
                      disabled={loading}
                    >
                      {selectedUnitLabel || "Selecionar Área/Depto/Setor/Projeto"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 z-[1000] w-[480px]">
                    <Command>
                      <CommandInput placeholder="Digite código ou nome..." />
                      <CommandList className="max-h-[60vh]">
                        <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>

                        {(["area", "department", "sector", "project"] as const).map((t) => (
                          grouped[t].length > 0 && (
                            <CommandGroup key={t} heading={typeLabelMap[t]}>
                              {grouped[t].map((u) => (
                                <CommandItem
                                  key={u.id}
                                  value={`${u.code || ""} ${u.description || u.name}`}
                                  onSelect={() => {
                                    handleUnitChange(u.id);
                                    setOpenUnits(false);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm">
                                      {u.code ? <span className="font-mono mr-1">{u.code}</span> : null}
                                      {u.description || u.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {typeLabelMap[u.type] || u.type}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )
                        ))}

                        <CommandGroup heading="Ações">
                          <CommandItem
                            value="limpar"
                            onSelect={() => {
                              handleUnitChange("");
                              setOpenUnits(false);
                            }}
                          >
                            Limpar seleção
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Selecione a unidade onde o colaborador está alocado (Área, Departamento, Setor, Projeto)
                </p>
                {positions.length === 0 && (
                  <div className="text-sm text-muted-foreground mt-2 bg-amber-50 dark:bg-amber-950 p-3 rounded border border-amber-200 dark:border-amber-800 space-y-2">
                    <p>⚠️ Nenhuma Unidade Organizacional cadastrada (Área/Departamento/Setor/Projeto).</p>
                    <p className="text-xs">O cadastro pode ser feito sem vínculo. Você pode vincular depois.</p>
                    <a 
                      href="/organization" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Abrir Estrutura Organizacional →
                    </a>
                  </div>
                )}
                {loadingBreadcrumb && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando hierarquia...
                  </div>
                )}
                {selectedUnitBreadcrumb && !loadingBreadcrumb && (
                  <div className="text-xs font-mono bg-muted p-2 rounded mt-2">
                    📍 {selectedUnitBreadcrumb}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title_id">Cargo (Plano de Cargos)</Label>
                <select
                  id="job_title_id"
                  value={formData.job_title_id}
                  onChange={(e) => setFormData({ ...formData, job_title_id: e.target.value })}
                  disabled={loading}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um cargo</option>
                  {jobTitles.map((jobTitle) => (
                    <option key={jobTitle.id} value={jobTitle.id}>
                      {jobTitle.title}
                    </option>
                  ))}
                </select>
                {selectedJobTitle && (
                  <div className="mt-2 p-3 bg-muted rounded-md space-y-1">
                    <p className="text-xs font-medium">Informações do Cargo:</p>
                    <p className="text-xs"><span className="font-medium">Código:</span> {selectedJobTitle.code}</p>
                    <p className="text-xs"><span className="font-medium">Grade:</span> {selectedJobTitle.grade}</p>
                    <p className="text-xs"><span className="font-medium">Pontos Medianos:</span> {selectedJobTitle.median_points.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_id">Gestor Direto</Label>
                <select
                  id="manager_id"
                  value={formData.manager_id}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  disabled={loading}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um gestor</option>
                  {managers
                    .filter(m => m.id !== userId) // Don't allow selecting self as manager
                    .map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Defina quem é o gestor direto deste colaborador
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
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
