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
import { Loader2, HelpCircle } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

interface OrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string | null;
  onSuccess: () => void;
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
}

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

export function OrganizationDialog({ open, onOpenChange, entityId, onSuccess }: OrganizationDialogProps) {
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
  });
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  useEffect(() => {
    if (open) {
      if (entityId) {
        fetchEntityData();
      } else {
        resetForm();
      }
      fetchParentOptions();
    }
  }, [open, entityId]);

  useEffect(() => {
    if (formData.type) {
      fetchParentOptions();
    }
  }, [formData.type]);

  const fetchEntityData = async () => {
    if (!entityId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("organizational_structure")
        .select("*")
        .eq("id", entityId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || "",
          code: data.code || "",
          type: data.type || "",
          description: data.description || "",
          parent_id: data.parent_id || "",
          fantasy_name: data.fantasy_name || "",
          cnpj: data.cnpj || "",
          address: data.address || "",
          union_name: data.union_name || "",
          base_date: data.base_date || "",
          logo_url: data.logo_url || "",
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
      const { data, error } = await supabase
        .from("organizational_structure")
        .select("id, name, code, type")
        .order("code");

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

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "company",
      description: "",
      parent_id: "",
      fantasy_name: "",
      cnpj: "",
      address: "",
      union_name: "",
      base_date: "",
      logo_url: "",
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
      
      const dataToSave = {
        name: formData.name,
        code: formData.code || null,
        type: formData.type,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
        fantasy_name: isCompanyType ? (formData.fantasy_name || null) : null,
        cnpj: isCompanyType ? (formData.cnpj || null) : null,
        address: isCompanyType ? (formData.address || null) : null,
        union_name: isCompanyType ? (formData.union_name || null) : null,
        base_date: isCompanyType ? (formData.base_date || null) : null,
        logo_url: formData.type === 'company' ? (formData.logo_url || null) : null,
      };

      if (entityId) {
        const { error } = await supabase
          .from("organizational_structure")
          .update(dataToSave)
          .eq("id", entityId);

        if (error) throw error;
        toast.success("Entidade atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from("organizational_structure")
          .insert([dataToSave]);

        if (error) throw error;
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
