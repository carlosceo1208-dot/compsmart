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

      setParentOptions(filtered);
    } catch (error) {
      console.error("Error fetching parent options:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "",
      description: "",
      parent_id: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);

      const dataToSave = {
        name: formData.name,
        code: formData.code || null,
        type: formData.type,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
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
      // Erro 23505 = unique violation (código duplicado entre irmãos)
      if (error.code === '23505' && error.message.includes('idx_org_structure_sibling_code')) {
        toast.error("Código já em uso no mesmo nível hierárquico. Escolha outro código.");
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
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da entidade"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: EMP-001, MTZ-001, ARE-010"
                title="Código identificador único dentro do mesmo nível hierárquico"
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
                  <SelectContent className="bg-background z-50">
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
