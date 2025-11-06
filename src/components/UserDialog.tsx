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
import { calculateSalaryRangePercentage, formatSalaryPercentage, getSalaryStatusBadge } from "@/lib/salaryCalculations";
import { z } from "zod";

const userSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  employee_number: z.string().min(1, "Número de Registro é obrigatório"),
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
      return num >= -100 && num <= 100;
    }, { message: "Porcentagem deve estar entre -100% e 100%" }),
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
  employee_number: string;
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

interface Profile {
  id: string;
  full_name: string;
  email: string;
  employee_number: string | null;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  job_title: string | null;
  grade: string | null;
  salary: number | null;
  variable_salary: number | null;
  salary_range_percentage: number | null;
  performance_rating: number | null;
  unit_id: string | null;
  manager_id: string | null;
  job_title_id: string | null;
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
    employee_number: "",
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
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [openEmployees, setOpenEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);

  useEffect(() => {
    if (open) {
      fetchPositions();
      fetchManagers();
      fetchJobTitles();
      fetchEmployees();
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
      
      // Auto-preencher job_title e grade
      if (jobTitle) {
        setFormData(prev => ({
          ...prev,
          job_title: jobTitle.title,
          grade: jobTitle.grade
        }));
      }
    } else {
      setSelectedJobTitle(null);
    }
  }, [formData.job_title_id, jobTitles]);

  // Calcular salary_range_percentage automaticamente
  useEffect(() => {
    const calculatePercentage = async () => {
      if (!formData.job_title_id || !formData.salary) return;
      
      const selectedJob = jobTitles.find(jt => jt.id === formData.job_title_id);
      if (!selectedJob) return;
      
      const paddedGrade = selectedJob.grade.toString().padStart(3, '0');
      
      try {
        // Buscar tabela ativa
        const { data: activeTable } = await supabase
          .from('salary_tables')
          .select('id')
          .eq('is_active', true)
          .single();
        
        if (!activeTable) return;
        
        // Buscar faixa salarial
        const { data: salaryRange } = await supabase
          .from('salary_ranges')
          .select('min_value, median_value, max_value')
          .eq('grade', paddedGrade)
          .eq('salary_table_id', activeTable.id)
          .maybeSingle();
        
        if (salaryRange) {
          const salary = parseFloat(formData.salary.toString().replace(/\./g, '').replace(',', '.'));
          const percentage = calculateSalaryRangePercentage(salary, salaryRange);
          
          setFormData(prev => ({
            ...prev,
            salary_range_percentage: formatSalaryPercentage(percentage)
          }));
        }
      } catch (error) {
        console.error("Error calculating percentage:", error);
      }
    };
    
    calculatePercentage();
  }, [formData.job_title_id, formData.salary, jobTitles]);

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

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, employee_number, phone, cpf, birth_date, job_title, grade, salary, variable_salary, salary_range_percentage, performance_rating, unit_id, manager_id, job_title_id")
        .eq("status", "active")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleEmployeeSelect = async (employee: Profile) => {
    setSelectedEmployee(employee);
    
    // Buscar breadcrumb se tiver unit_id
    let breadcrumb = '';
    if (employee.unit_id) {
      try {
        const { data } = await supabase.rpc('get_org_breadcrumb_friendly', { 
          entity_id: employee.unit_id 
        });
        breadcrumb = data || '';
      } catch (error) {
        console.error("Error fetching breadcrumb:", error);
      }
    }
    
    setFormData({
      ...formData,
      full_name: employee.full_name,
      email: employee.email || formData.email,
      employee_number: employee.employee_number || "",
      phone: employee.phone || "",
      cpf: employee.cpf || "",
      birth_date: employee.birth_date || "",
      job_title: employee.job_title || "",
      grade: employee.grade || "",
      salary: employee.salary 
        ? employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "",
      variable_salary: employee.variable_salary 
        ? employee.variable_salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "",
      salary_range_percentage: employee.salary_range_percentage?.toString() || "",
      performance_rating: employee.performance_rating?.toString() || "",
      unit_id: employee.unit_id || "",
      manager_id: employee.manager_id || "",
      job_title_id: employee.job_title_id || "",
    });
    
    setSelectedUnitBreadcrumb(breadcrumb);
  };

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, employee_number, phone, cpf, birth_date, job_title, grade, salary, variable_salary, salary_range_percentage, performance_rating, unit_id, manager_id, job_title_id")
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
        employee_number: profile.employee_number || "",
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
      toast.error("Erro ao carregar dados do funcionário");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      employee_number: "",
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
    setSelectedEmployee(null);
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
      const parseBRCurrency = (value: string | undefined): number | null => {
        if (!value) return null;
        // Remove dots (thousand separators) and replace comma with dot
        const cleaned = value.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      };

      // Validar unicidade do número de registro
      if (formData.employee_number) {
        const { data: existingEmployee } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('employee_number', formData.employee_number)
          .neq('id', userId || '00000000-0000-0000-0000-000000000000')
          .maybeSingle();
        
        if (existingEmployee) {
          toast.error(
            `❌ Número de Registro "${formData.employee_number}" já está em uso por ${existingEmployee.full_name}`
          );
          setLoading(false);
          return;
        }
      }

      if (userId) {
        // Update existing user
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            employee_number: formData.employee_number,
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
          toast.info("Funcionário atualizado sem vínculo organizacional. Você pode vincular a um Setor/Projeto depois em Editar Funcionário ou na Estrutura Organizacional.");
        } else {
          toast.success("Funcionário atualizado com sucesso!");
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
            employee_number: formData.employee_number,
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
          toast.info("Funcionário criado sem vínculo organizacional. Você pode vincular a uma Área/Departamento/Setor/Projeto depois em Editar Funcionário ou na Estrutura Organizacional.");
        } else {
          toast.success("Funcionário criado com sucesso!");
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
        toast.error(error.message || "Erro ao salvar funcionário");
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
          <DialogTitle>{userId ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
          <DialogDescription>
            {userId ? "Atualize as informações do funcionário e suas permissões" : "Preencha os dados para criar um novo funcionário"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Popover open={openEmployees} onOpenChange={setOpenEmployees}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEmployees}
                    className="w-full justify-between"
                    type="button"
                    disabled={loading}
                  >
                    {formData.full_name || "Buscar funcionário ou digitar novo nome"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 z-[1000] w-full">
                  <Command>
                    <CommandInput 
                      placeholder="Digite o nome do funcionário..." 
                      value={formData.full_name}
                      onValueChange={(value) => {
                        setFormData({ ...formData, full_name: value });
                        if (!value) setSelectedEmployee(null);
                      }}
                    />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>
                        <div className="p-2 text-sm text-muted-foreground">
                          {formData.full_name ? `Nenhum funcionário encontrado. Use "${formData.full_name}" para novo cadastro` : "Digite para buscar"}
                        </div>
                      </CommandEmpty>
                      
                      {employees.filter(emp => 
                        emp.full_name.toLowerCase().includes(formData.full_name.toLowerCase())
                      ).length > 0 && (
                        <CommandGroup heading="Funcionários Cadastrados">
                          {employees
                            .filter(emp => emp.full_name.toLowerCase().includes(formData.full_name.toLowerCase()))
                            .slice(0, 10)
                            .map((emp) => (
                              <CommandItem
                                key={emp.id}
                                value={emp.full_name}
                                onSelect={() => {
                                  handleEmployeeSelect(emp);
                                  setOpenEmployees(false);
                                }}
                              >
                                <div className="flex flex-col w-full">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{emp.full_name}</span>
                                    <span className="text-xs text-muted-foreground">#{emp.email}</span>
                                  </div>
                                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                    {emp.job_title && <span>Cargo: {emp.job_title}</span>}
                                    {emp.grade && <span>Grade: {emp.grade}</span>}
                                    {emp.salary && (
                                      <span>
                                        Salário: R$ {emp.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      )}
                      
                      <CommandGroup heading="Ações">
                        <CommandItem
                          onSelect={() => {
                            setOpenEmployees(false);
                          }}
                        >
                          {formData.full_name ? `Usar "${formData.full_name}" (novo cadastro)` : "Fechar"}
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {selectedEmployee 
                  ? `✅ Dados importados de: ${selectedEmployee.full_name}` 
                  : "Digite para buscar funcionário existente ou criar novo"}
              </p>
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
              <Label htmlFor="employee_number" className="flex items-center gap-1">
                Número de Registro (RE)
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="employee_number"
                value={formData.employee_number}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                  setFormData({ ...formData, employee_number: value });
                }}
                disabled={loading}
                placeholder="Ex: 2025005, FUNC-001, RE-123"
                maxLength={50}
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                📋 Matrícula ou número de registro interno da empresa
              </p>
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
                <Label htmlFor="salary_range_percentage">% da Faixa (Calculado Automaticamente)</Label>
                <Input
                  id="salary_range_percentage"
                  type="text"
                  value={
                    formData.salary_range_percentage 
                      ? `${parseFloat(formData.salary_range_percentage).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always' })}%`
                      : "Selecione cargo e informe salário"
                  }
                  disabled={true}
                  className={`bg-muted font-mono ${
                    parseFloat(formData.salary_range_percentage || '0') < 0 
                      ? 'text-red-600 dark:text-red-400 font-bold' 
                      : parseFloat(formData.salary_range_percentage || '0') >= 50 && parseFloat(formData.salary_range_percentage || '0') <= 100
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                  }`}
                />
                {formData.salary_range_percentage && (
                  <div className={`mt-2 p-3 rounded-md ${getSalaryStatusBadge(parseFloat(formData.salary_range_percentage)).color}`}>
                    <p className="text-sm font-medium">
                      {getSalaryStatusBadge(parseFloat(formData.salary_range_percentage)).label}
                    </p>
                    <p className="text-xs opacity-90 mt-1">
                      {parseFloat(formData.salary_range_percentage) < 0 
                        ? `⚠️ Salário está ${Math.abs(parseFloat(formData.salary_range_percentage)).toFixed(2)}% ABAIXO do mínimo do mercado`
                        : parseFloat(formData.salary_range_percentage) >= 0 && parseFloat(formData.salary_range_percentage) < 50
                          ? `📊 Salário está ${parseFloat(formData.salary_range_percentage).toFixed(2)}% dentro da faixa (abaixo da média de mercado)`
                          : parseFloat(formData.salary_range_percentage) >= 50 && parseFloat(formData.salary_range_percentage) <= 100
                            ? `✅ Salário está ${parseFloat(formData.salary_range_percentage).toFixed(2)}% dentro da faixa (próximo ou acima da média de mercado)`
                            : `🔴 Salário está ${parseFloat(formData.salary_range_percentage).toFixed(2)}% acima do máximo da faixa`
                      }
                    </p>
                  </div>
                )}
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
