import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Loader2, HelpCircle, Rocket, TrendingUp, Crown, Cog, BarChart3, Target, ShieldCheck, Activity, Smile, Network, HeartPulse, Puzzle } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Switch } from "@/components/ui/switch";

type CorePlanKey = "Starter" | "Medium" | "Pro" | "Enterprise";
type Nr1PlanKey = "Essencial" | "Crescimento" | "Consolidação" | "Performance" | "Corporate";

const NR1_MODULE_PREFIX = "NR1:";

const PLANS: Array<{
  key: CorePlanKey;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  selectedClass: string;
  iconWrap: string;
}> = [
  { key: "Starter", description: "Entrada para estruturar remuneração e desempenho", icon: Rocket,
    selectedClass: "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20",
    iconWrap: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { key: "Medium", description: "Para empresas em crescimento e maior controle", icon: BarChart3,
    selectedClass: "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20",
    iconWrap: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "Pro", description: "Gestão avançada com recursos estratégicos", icon: TrendingUp,
    selectedClass: "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20",
    iconWrap: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "Enterprise", description: "Para grandes empresas e estruturas complexas", icon: Crown,
    selectedClass: "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20",
    iconWrap: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
];

const NR1_PLANS: Array<{
  key: Nr1PlanKey;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  selectedClass: string;
  iconWrap: string;
}> = [
  { key: "Essencial", description: "Base NR-1 para diagnóstico e plano de ação", icon: ShieldCheck,
    selectedClass: "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20",
    iconWrap: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { key: "Crescimento", description: "Para ampliar acompanhamento e ações preventivas", icon: TrendingUp,
    selectedClass: "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20",
    iconWrap: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "Consolidação", description: "Para consolidar rotinas de saúde e bem-estar", icon: Cog,
    selectedClass: "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20",
    iconWrap: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { key: "Performance", description: "Para gestão avançada e indicadores preventivos", icon: Target,
    selectedClass: "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20",
    iconWrap: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  { key: "Corporate", description: "Para estruturas corporativas e múltiplas unidades", icon: Crown,
    selectedClass: "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20",
    iconWrap: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
];

interface ExistingStats {
  hasCompany: boolean;
  hasHeadquarters: boolean;
  hasBranch: boolean;
  hasArea: boolean;
  hasDepartment: boolean;
  hasSector: boolean;
}

interface OrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string | null;
  onSuccess: () => void;
  existingStats?: ExistingStats;
  rootCompanyId?: string;
}

interface EntityData {
  name: string;
  code: string;
  type: string;
  description: string;
  parent_id: string;
  fantasy_name: string;
  cnpj: string;
  address: string;
  union_name: string;
  base_date: string;
  logo_url: string;
  industry_sector: string;
  selected_plan: CorePlanKey | "";
  selected_nr1_plan: Nr1PlanKey | "";
  selected_modules: string[];
  risk_grade: string;
  unit_role: "matriz" | "filial" | "";
  nr1_addon_enabled: boolean;
  clima_addon_enabled: boolean;
  fib_addon_enabled: boolean;
  psicossociais_addon_enabled: boolean;
  checkup_addon_enabled: boolean;
}

const INDUSTRY_SECTORS = [
  { value: "tecnologia", label: "Tecnologia / TI" },
  { value: "marketing_publicidade", label: "Marketing e Publicidade" },
  { value: "financeiro_bancario", label: "Financeiro / Bancário" },
  { value: "varejo_comercio", label: "Varejo / Comércio" },
  { value: "industria_manufatura", label: "Indústria / Manufatura" },
  { value: "saude_hospitalar", label: "Saúde / Hospitalar" },
  { value: "educacao", label: "Educação" },
  { value: "servicos_profissionais", label: "Serviços Profissionais" },
  { value: "logistica_transportes", label: "Logística / Transportes" },
  { value: "construcao_civil", label: "Construção Civil" },
  { value: "agronegocio", label: "Agronegócio" },
  { value: "energia_utilities", label: "Energia / Utilities" },
  { value: "outro", label: "Outro" },
];

interface ParentOption {
  id: string;
  name: string;
  code: string;
  type: string;
}

const ORG_TYPES = [
  { value: "company", label: "Empresa" },
  { value: "headquarters", label: "Matriz" },
  { value: "branch", label: "Filial" },
  { value: "area", label: "Área" },
  { value: "department", label: "Departamento" },
  { value: "sector", label: "Setor" },
  { value: "project", label: "Projeto" },
];

// Hierarchy rules: defines what types can be parents of each type
const HIERARCHY_RULES: Record<string, string[]> = {
  company: [], // No parent (root)
  headquarters: ["company"], // Only Company
  branch: ["company"], // Only Company
  area: ["headquarters", "branch"], // Only Headquarters or Branch
  department: ["area"], // Only Area
  sector: ["department"], // Only Department
  project: ["sector"], // Only Sector
};

// Defines what types can be children of each type
const VALID_CHILDREN: Record<string, string[]> = {
  company: ["headquarters", "branch"],
  headquarters: ["area"],
  branch: ["area"],
  area: ["department"],
  department: ["sector"],
  sector: ["project"],
  project: [], // No children (leaf node)
};

export function OrganizationDialog({ open, onOpenChange, entityId, onSuccess, existingStats, rootCompanyId }: OrganizationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EntityData>({
    name: "",
    code: "",
    type: "",
    description: "",
    parent_id: "",
    fantasy_name: "",
    cnpj: "",
    address: "",
    union_name: "",
    base_date: "",
    logo_url: "",
    industry_sector: "",
    selected_plan: "",
    selected_nr1_plan: "",
    selected_modules: [],
    risk_grade: "",
    unit_role: "",
    nr1_addon_enabled: false,
    clima_addon_enabled: false,
    fib_addon_enabled: false,
    psicossociais_addon_enabled: false,
    checkup_addon_enabled: false,
  });
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  useEffect(() => {
    if (open) {
      if (entityId) {
        fetchEntityData();
      } else {
        resetForm(existingStats);
      }
      fetchParentOptions();
    }
  }, [open, entityId, existingStats]);

  useEffect(() => {
    if (formData.type) {
      fetchParentOptions();
    }
  }, [formData.type]);

  const fetchEntityData = async () => {
    if (!entityId) return;

    try {
      setLoading(true);
      // SECURITY: avoid select('*'); cnpj is restricted, fetched via admin RPC
      const { data, error } = await supabase
        .from("organizational_structure")
        .select("id, name, type, code, description, parent_id, fantasy_name, address, union_name, base_date, logo_url, industry_sector, root_company_id, selected_plan, selected_modules, total_price, risk_grade, unit_role, nr1_addon_enabled, clima_addon_enabled, fib_addon_enabled, psicossociais_addon_enabled, checkup_addon_enabled")
        .eq("id", entityId)
        .single();


      if (error) throw error;

      let cnpjValue = "";
      if (data) {
        const { data: billing } = await supabase
          .rpc('get_company_billing_info', { _company_id: entityId })
          .maybeSingle();
        cnpjValue = billing?.cnpj || "";

        const rawModules = (data as any).selected_modules;
        const modules = Array.isArray(rawModules) ? (rawModules as string[]) : [];
        const rawNr1Plan = modules
          .find((m) => m.startsWith(NR1_MODULE_PREFIX))
          ?.replace(NR1_MODULE_PREFIX, "");
        const nr1Plan: Nr1PlanKey | "" =
          rawNr1Plan === "Essencial" || rawNr1Plan === "Crescimento" || rawNr1Plan === "Consolidação" || rawNr1Plan === "Performance" || rawNr1Plan === "Corporate"
            ? rawNr1Plan
            : "";
        const rawPlan = (data as any).selected_plan;
        const plan: CorePlanKey | "" =
          rawPlan === "Starter" || rawPlan === "Medium" || rawPlan === "Pro" || rawPlan === "Enterprise" ? rawPlan : "";

        setFormData({
          name: data.name || "",
          code: data.code || "",
          type: data.type || "",
          description: data.description || "",
          parent_id: data.parent_id || "",
          fantasy_name: data.fantasy_name || "",
          cnpj: cnpjValue,
          address: data.address || "",
          union_name: data.union_name || "",
          base_date: data.base_date || "",
          logo_url: data.logo_url || "",
          industry_sector: data.industry_sector || "",
          selected_plan: plan,
          selected_nr1_plan: nr1Plan,
          selected_modules: modules,
          risk_grade: (data as any).risk_grade != null ? String((data as any).risk_grade) : "",
          unit_role: ((data as any).unit_role === "matriz" || (data as any).unit_role === "filial")
            ? (data as any).unit_role
            : "",
          nr1_addon_enabled: !!(data as any).nr1_addon_enabled,
          clima_addon_enabled: !!(data as any).clima_addon_enabled,
          fib_addon_enabled: !!(data as any).fib_addon_enabled,
          psicossociais_addon_enabled: !!(data as any).psicossociais_addon_enabled,
          checkup_addon_enabled: !!(data as any).checkup_addon_enabled,
        });
      }
    } catch (error: any) {
      toast.error("Erro ao carregar dados da entidade");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParentOptions = async () => {
    try {
      setLoadingParents(true);
      
      let query = supabase
        .from("organizational_structure")
        .select("id, name, code, type, root_company_id");
      
      // Filtrar por empresa ativa (CORREÇÃO DE ISOLAMENTO)
      if (rootCompanyId) {
        query = query.or(`root_company_id.eq.${rootCompanyId},id.eq.${rootCompanyId}`);
      }
      
      const { data, error } = await query.order("code");

      if (error) throw error;

      // Filter based on hierarchy rules
      let filtered = data || [];
      
      const validParentTypes = HIERARCHY_RULES[formData.type] || [];
      
      if (validParentTypes.length === 0) {
        // No valid parents (e.g., company is root)
        filtered = [];
      } else {
        // Filter to only show valid parent types
        filtered = filtered.filter((e) => validParentTypes.includes(e.type));
      }

      // Exclude current entity when editing
      if (entityId) {
        filtered = filtered.filter((e) => e.id !== entityId);
      }

      // Sort numerically by code, fallback to name
      const extractNum = (code?: string) => {
        const m = code?.match(/\d+/)?.[0];
        return m ? parseInt(m, 10) : Number.MAX_SAFE_INTEGER;
      };
      filtered.sort((a, b) => {
        const an = extractNum(a.code);
        const bn = extractNum(b.code);
        if (an !== bn) return an - bn;
        return (a.name || "").localeCompare(b.name || "");
      });

      setParentOptions(filtered);
    } catch (error) {
      console.error("Error fetching parent options:", error);
    } finally {
      setLoadingParents(false);
    }
  };

  const resetForm = (stats?: ExistingStats) => {
    // Determinar tipo padrão baseado na estrutura existente
    let defaultType = "";
    
    if (!stats?.hasCompany) {
      defaultType = "company";
    } else if (!stats?.hasHeadquarters && !stats?.hasBranch) {
      defaultType = "headquarters";
    } else if (!stats?.hasArea) {
      defaultType = "area";
    } else if (!stats?.hasDepartment) {
      defaultType = "department";
    } else if (!stats?.hasSector) {
      defaultType = "sector";
    } else {
      // Se já tem tudo, default para projeto ou departamento
      defaultType = "department";
    }
    
    setFormData({
      name: "",
      code: "",
      type: defaultType,
      description: "",
      parent_id: "",
      fantasy_name: "",
      cnpj: "",
      address: "",
      union_name: "",
      base_date: "",
      logo_url: "",
      industry_sector: "",
      selected_plan: "",
      selected_nr1_plan: "",
      selected_modules: [],
      risk_grade: "",
      unit_role: "",
      nr1_addon_enabled: false,
      clima_addon_enabled: false,
      fib_addon_enabled: false,
      psicossociais_addon_enabled: false,
      checkup_addon_enabled: false,
    });
  };

  // Formatar CNPJ: 00.000.000/0000-00
  const formatCNPJ = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  // Validar CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    const numbers = cnpj.replace(/\D/g, '');
    return numbers.length === 14;
  };

  // Formatar Data Base: MM/DD
  const formatBaseDate = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 4) {
      return numbers.replace(/^(\d{2})(\d)/, '$1/$2');
    }
    return value;
  };

  // Validar Data Base
  const validateBaseDate = (date: string): boolean => {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/;
    return regex.test(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    // Validações específicas COMPSMART
    const isCompanyType = ['company', 'headquarters', 'branch'].includes(formData.type);
    if (isCompanyType) {
      if (!formData.cnpj) {
        toast.error("CNPJ é obrigatório para empresas, matrizes e filiais");
        return;
      }
      
      if (!validateCNPJ(formData.cnpj)) {
        toast.error("CNPJ inválido - deve conter 14 dígitos");
        return;
      }
      
      if (formData.base_date && !validateBaseDate(formData.base_date)) {
        toast.error("Data base inválida (use formato MM/DD)");
        return;
      }

      if (formData.type === 'company') {
        if (!formData.selected_plan && !formData.selected_nr1_plan) {
          toast.error("Selecione pelo menos um plano para continuar");
          return;
        }
      }
    }

    // Validar correspondência entre código e tipo
    if (formData.code) {
      const codePrefix = formData.code.substring(0, 3);
      const expectedPrefix: Record<string, string> = {
        'company': 'EMP',
        'headquarters': 'MTZ',
        'branch': 'FIL',
        'area': 'ARE',
        'department': 'DEP',
        'sector': 'SET',
        'project': 'PRJ'
      };

      const expected = expectedPrefix[formData.type];
      if (codePrefix !== expected) {
        toast.error(`Código inválido! Para tipo "${getTypeLabel(formData.type)}", o código deve começar com "${expected}-"`);
        return;
      }
    }

    try {
      setLoading(true);

      const isCompanyType = ['company', 'headquarters', 'branch'].includes(formData.type);
      
      const isCompany = formData.type === 'company';
      const selectedModulesToSave = isCompany && formData.selected_nr1_plan
        ? [`${NR1_MODULE_PREFIX}${formData.selected_nr1_plan}`]
        : [];

      const dataToSave = {
        name: formData.name,
        code: formData.code || null,
        type: formData.type,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
        fantasy_name: isCompanyType ? (formData.fantasy_name || null) : null,
        address: isCompanyType ? (formData.address || null) : null,
        union_name: isCompanyType ? (formData.union_name || null) : null,
        base_date: isCompanyType ? (formData.base_date || null) : null,
        logo_url: formData.type === 'company' ? (formData.logo_url || null) : null,
        industry_sector: formData.type === 'company' ? (formData.industry_sector || null) : null,
        selected_plan: isCompany ? formData.selected_plan || null : null,
        selected_modules: isCompany ? selectedModulesToSave : [],
        total_price: null,
        risk_grade: isCompany && formData.risk_grade ? parseInt(formData.risk_grade, 10) : null,
        unit_role: isCompany ? (formData.unit_role || null) : null,
        nr1_addon_enabled: isCompany ? !!formData.nr1_addon_enabled : false,
        clima_addon_enabled: isCompany ? !!formData.clima_addon_enabled : false,
        fib_addon_enabled: isCompany ? !!formData.fib_addon_enabled : false,
        psicossociais_addon_enabled: isCompany ? !!formData.psicossociais_addon_enabled : false,
        checkup_addon_enabled: isCompany ? !!formData.checkup_addon_enabled : false,
      };

      const billingDataToSave = isCompanyType
        ? {
            company_id: entityId,
            cnpj: formData.cnpj || null,
          }
        : null;

      if (entityId) {
        const { error } = await supabase
          .from("organizational_structure")
          .update(dataToSave)
          .eq("id", entityId);

        if (error) throw error;

        if (billingDataToSave) {
          const { error: billingError } = await supabase
            .from("company_billing")
            .upsert(billingDataToSave, { onConflict: "company_id" });

          if (billingError) throw billingError;
        }

        toast.success("Entidade atualizada com sucesso");
      } else {
        const { data: insertedEntity, error } = await supabase
          .from("organizational_structure")
          .insert(dataToSave)
          .select("id")
          .single();

        if (error) throw error;

        if (isCompanyType && insertedEntity?.id) {
          const { error: billingError } = await supabase
            .from("company_billing")
            .upsert(
              {
                company_id: insertedEntity.id,
                cnpj: formData.cnpj || null,
              },
              { onConflict: "company_id" }
            );

          if (billingError) throw billingError;
        }

        toast.success("Entidade criada com sucesso");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      // Erro 23505 = unique violation
      if (error.code === '23505') {
        if (error.message.includes('idx_org_structure_sibling_code')) {
          toast.error("Código já em uso no mesmo nível hierárquico. Escolha outro código.");
        } else if (error.message.includes('idx_org_structure_cnpj')) {
          toast.error("CNPJ já cadastrado. Cada empresa deve ter CNPJ único.");
        } else {
          toast.error("Erro ao salvar: registro duplicado");
        }
      }
      // Erros de hierarquia do trigger
      else if (error.message.includes('não pode ter pai do tipo')) {
        toast.error(error.message);
      } 
      else {
        toast.error("Erro ao salvar entidade");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return ORG_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entityId ? "Editar Entidade" : "Nova Entidade"}
          </DialogTitle>
          <DialogDescription>
            {entityId
              ? "Atualize as informações da entidade organizacional"
              : "Adicione uma nova entidade à estrutura organizacional"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {formData.type === 'company' ? 'Razão Social' : 
                 formData.type === 'headquarters' ? 'Nome da Matriz' :
                 formData.type === 'branch' ? 'Nome da Filial' : 
                 'Nome'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={
                  formData.type === 'company' ? 'Razão social da empresa' :
                  formData.type === 'headquarters' ? 'Nome da matriz' :
                  formData.type === 'branch' ? 'Nome da filial' :
                  'Nome da entidade'
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={
                  formData.type
                    ? `Ex: ${
                        {
                          company: "EMP-001",
                          headquarters: "MTZ-001",
                          branch: "FIL-001",
                          area: "ARE-010",
                          department: "DEP-001",
                          sector: "SET-001",
                          project: "PRJ-001",
                        }[formData.type] || "Ex: EMP-001"
                      }`
                    : "Ex: EMP-001, MTZ-001, ARE-010"
                }
                title="Código identificador único dentro do mesmo nível hierárquico"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Código é opcional mas recomendado para ordenação
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-1">
                Tipo <span className="text-destructive">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Hierarquia: Empresa → Matriz/Filial → Área → Departamento → Setor → Projeto
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value, parent_id: "" })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.type && HIERARCHY_RULES[formData.type].length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  📌 Pais aceitos: {HIERARCHY_RULES[formData.type]
                    .map(t => ORG_TYPES.find(o => o.value === t)?.label)
                    .join(', ')}
                </p>
              )}
              {formData.type && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Campos adicionais (Nome Fantasia, CNPJ, Endereço, Sindicato, Data Base) aparecem para Empresa, Matriz e Filial.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_id">Entidade Pai</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.parent_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                  disabled={!formData.type || loadingParents || formData.type === "company"}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={
                      formData.type === "company" 
                        ? "Empresas não têm pai" 
                        : loadingParents 
                        ? "Carregando..." 
                        : "Selecione a entidade pai"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.length === 0 && formData.type && formData.type !== "company" ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        <p>⚠️ Nenhuma entidade pai disponível</p>
                        <p className="text-xs mt-1">
                          {formData.type === "headquarters" && "Certifique-se de ter Empresas cadastradas."}
                          {formData.type === "branch" && "Certifique-se de ter Empresas cadastradas."}
                          {formData.type === "area" && "Certifique-se de ter Matrizes ou Filiais cadastradas."}
                          {formData.type === "department" && "Certifique-se de ter Áreas cadastradas."}
                          {formData.type === "sector" && "Certifique-se de ter Departamentos cadastrados."}
                          {formData.type === "project" && "Certifique-se de ter Setores cadastrados."}
                        </p>
                      </div>
                    ) : (
                      parentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono">
                              {option.code}
                            </Badge>
                            <span>{option.name}</span>
                            <span className="text-muted-foreground text-xs">
                              ({getTypeLabel(option.type)})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.parent_id && formData.type !== "company" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData({ ...formData, parent_id: "" })}
                    disabled={loading}
                  >
                    ×
                  </Button>
                )}
              </div>
              {formData.type && formData.type !== "company" && (
                <p className="text-xs text-muted-foreground">
                  {formData.type === "headquarters" && "Matrizes devem ter uma Empresa como pai"}
                  {formData.type === "branch" && "Filiais devem ter uma Empresa como pai"}
                  {formData.type === "area" && "Áreas devem ter uma Matriz ou Filial como pai"}
                  {formData.type === "department" && "Departamentos devem ter uma Área como pai"}
                  {formData.type === "sector" && "Setores devem ter um Departamento como pai"}
                  {formData.type === "project" && "Projetos devem ter um Setor como pai"}
                </p>
              )}
            </div>
          </div>

          {/* Campos específicos COMPSMART */}
          {(formData.type === 'company' || formData.type === 'headquarters' || formData.type === 'branch') && (
            <>
              <div className="pt-4 pb-2 border-t">
                <h3 className="text-sm font-semibold text-foreground">Informações da Empresa/Unidade</h3>
                <p className="text-xs text-muted-foreground mt-1">Campos específicos para empresas, matrizes e filiais</p>
              </div>

              {/* Logo Upload - apenas para tipo company */}
              {formData.type === 'company' && (
                <div className="space-y-2">
                  <Label>Logo da Empresa</Label>
                  <ImageUpload
                    value={formData.logo_url || null}
                    onChange={(url) => setFormData({ ...formData, logo_url: url || "" })}
                    bucket="company-logos"
                    label="Clique para selecionar o logo"
                    description="PNG, JPG, WEBP ou SVG até 2MB"
                    previewClassName="h-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    O logo será exibido em todo o sistema
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fantasy_name">Nome Fantasia</Label>
                <Input
                  id="fantasy_name"
                  value={formData.fantasy_name}
                  onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                  placeholder="Nome popular da empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">
                  CNPJ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => {
                    const formatted = formatCNPJ(e.target.value);
                    setFormData({ ...formData, cnpj: formatted });
                  }}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="font-mono"
                  required={formData.type === 'company' || formData.type === 'headquarters' || formData.type === 'branch'}
                />
                {formData.cnpj && !validateCNPJ(formData.cnpj) && (
                  <p className="text-xs text-destructive">CNPJ inválido - deve conter 14 dígitos</p>
                )}
              </div>

              {/* Grau de Risco (CNAE) + Tipo da Unidade (Matriz/Filial) - apenas empresa */}
              {formData.type === 'company' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="risk_grade" className="flex items-center gap-1">
                      Grau de Risco (CNAE)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Grau de risco da atividade econômica conforme NR-4 (1 = baixo, 4 = alto).
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Select
                      value={formData.risk_grade}
                      onValueChange={(value) => setFormData({ ...formData, risk_grade: value })}
                    >
                      <SelectTrigger id="risk_grade">
                        <SelectValue placeholder="Selecione o grau (1 a 4)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 — Risco Leve</SelectItem>
                        <SelectItem value="2">2 — Risco Médio</SelectItem>
                        <SelectItem value="3">3 — Risco Grave</SelectItem>
                        <SelectItem value="4">4 — Risco Máximo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_role">Tipo da Unidade</Label>
                    <Select
                      value={formData.unit_role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, unit_role: value as "matriz" | "filial" })
                      }
                    >
                      <SelectTrigger id="unit_role">
                        <SelectValue placeholder="Este cadastro é Matriz ou Filial?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matriz">Matriz</SelectItem>
                        <SelectItem value="filial">Filial</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Indica se este registro representa a Matriz ou uma Filial.
                    </p>
                  </div>
                </div>
              )}

              {/* Plano e Módulos - apenas para empresa (company) */}
              {formData.type === 'company' && (
                <div className="space-y-4 pt-2">
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-foreground">Plano e Módulos</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Defina o plano base e os módulos contratados por esta empresa.
                    </p>
                  </div>

                  {/* Plano Gestão Estratégica */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Plano Gestão Estratégica Remuneração e Avaliação de Desempenho
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Selecione a modalidade contratada para remuneração e desempenho. Os valores não aparecem nesta tela.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {PLANS.map((p) => {
                        const Icon = p.icon;
                        const isSel = formData.selected_plan === p.key;
                        return (
                          <button
                            type="button"
                            key={p.key}
                            onClick={() => setFormData({ ...formData, selected_plan: p.key })}
                            aria-pressed={isSel}
                            className={`relative text-left rounded-lg border-2 p-4 min-h-[110px] transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              isSel ? p.selectedClass : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            <div className="absolute top-3 right-3 h-4 w-4 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center">
                              {isSel && <div className="h-2 w-2 rounded-full bg-primary" />}
                            </div>
                            <div className={`inline-flex p-2 rounded-md ${p.iconWrap} mb-2`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="font-semibold text-sm">{p.key}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plano NR-1 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Plano NR1
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Selecione a modalidade contratada para NR-1. Os opcionais abaixo continuam sendo liberados por flag.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {NR1_PLANS.map((p) => {
                        const Icon = p.icon;
                        const isSel = formData.selected_nr1_plan === p.key;
                        return (
                          <button
                            type="button"
                            key={p.key}
                            onClick={() => setFormData({ ...formData, selected_nr1_plan: isSel ? "" : p.key })}
                            aria-pressed={isSel}
                            className={`relative text-left rounded-lg border-2 p-4 min-h-[110px] transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              isSel ? p.selectedClass : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            <div className="absolute top-3 right-3 h-4 w-4 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center">
                              {isSel && <div className="h-2 w-2 rounded-full bg-primary" />}
                            </div>
                            <div className={`inline-flex p-2 rounded-md ${p.iconWrap} mb-2`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="font-semibold text-sm">{p.key}</div>
                            <p className="text-xs text-muted-foreground mt-1 leading-snug">
                              {p.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add-ons opcionais */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Puzzle className="w-4 h-4 text-primary" />
                      <Label className="text-sm font-semibold">
                        Módulos opcionais (add-ons)
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Contrate de forma independente do plano. Quando desativados, os módulos aparecem bloqueados (cadeado) para o cliente.
                    </p>

                    {([
                      { key: "nr1_addon_enabled" as const, title: "NR-1 (Saúde Mental & Bem-Estar)", desc: "Diagnóstico, planos de ação, clima e biblioteca da Portaria MTE 1.419/2024.", Icon: ShieldCheck, accent: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
                      { key: "clima_addon_enabled" as const, title: "Clima Organizacional", desc: "Pesquisas de clima recorrentes, eNPS, segmentação por área/unidade e relatórios.", Icon: Activity, accent: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
                      { key: "fib_addon_enabled" as const, title: "FIB — Felicidade Interna Bruta", desc: "Indicador de bem-estar e satisfação, com tendências e benchmarks.", Icon: Smile, accent: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
                      { key: "psicossociais_addon_enabled" as const, title: "Cruzamento de Riscos Psicossociais", desc: "Correlação entre clima e riscos psicossociais (COPSOQ-III).", Icon: Network, accent: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
                      { key: "checkup_addon_enabled" as const, title: "Check-up de Colaborador", desc: "Acompanhamento contínuo com jornadas, check-ins e alertas preventivos.", Icon: HeartPulse, accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
                    ]).map((a) => {
                      const Icon = a.Icon;
                      const isOn = !!formData[a.key];
                      return (
                        <div key={a.key} className="rounded-lg border-2 border-dashed p-3 flex items-start gap-3 bg-card">
                          <div className={`p-2 rounded-md ${a.accent}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-sm">{a.title}</div>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{a.desc}</p>
                              </div>
                              <Switch
                                checked={isOn}
                                onCheckedChange={(checked) =>
                                  setFormData({ ...formData, [a.key]: checked })
                                }
                                aria-label={`Ativar ${a.title}`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}





              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="union_name">Sindicato</Label>
                  <Input
                    id="union_name"
                    value={formData.union_name}
                    onChange={(e) => setFormData({ ...formData, union_name: e.target.value })}
                    placeholder="Nome do sindicato"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base_date" className="flex items-center gap-1">
                    Data Base
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Data base sindical no formato Mês/Dia (ex: 05/01 para 1º de maio)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="base_date"
                    value={formData.base_date}
                    onChange={(e) => {
                      const formatted = formatBaseDate(e.target.value);
                      setFormData({ ...formData, base_date: formatted });
                    }}
                    placeholder="MM/DD"
                    maxLength={5}
                    className="font-mono"
                  />
                  {formData.base_date && !validateBaseDate(formData.base_date) && (
                    <p className="text-xs text-destructive">Formato inválido (use MM/DD)</p>
                  )}
                </div>
              </div>

              {/* Ramo de Atividade - apenas para tipo company */}
              {formData.type === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="industry_sector" className="flex items-center gap-1">
                    Ramo de Atividade
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            O ramo de atividade ajuda o Salary Smart a adaptar o vocabulário e análises ao contexto do seu negócio
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select
                    value={formData.industry_sector || ""}
                    onValueChange={(value) => setFormData({ ...formData, industry_sector: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ramo de atividade" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_SECTORS.map((sector) => (
                        <SelectItem key={sector.value} value={sector.value}>
                          {sector.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    💡 O Salary Smart ajustará seu vocabulário com base neste ramo
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da entidade"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {entityId ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
