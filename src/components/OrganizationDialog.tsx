import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  type: string;
}

const ORG_TYPES = [
  { value: "company", label: "Empresa" },
  { value: "branch", label: "Filial" },
  { value: "department", label: "Departamento" },
  { value: "area", label: "Área" },
  { value: "position", label: "Cargo" },
];

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
      setLoadingParents(true);
      let query = supabase
        .from("organizational_structure")
        .select("id, name, type")
        .order("name", { ascending: true });

      // Filter valid parent types based on selected type
      if (formData.type === "branch") {
        query = query.eq("type", "company");
      } else if (formData.type === "department") {
        query = query.in("type", ["company", "branch"]);
      } else if (formData.type === "area") {
        query = query.in("type", ["company", "branch", "department"]);
      } else if (formData.type === "position") {
        query = query.in("type", ["department", "area"]);
      }

      // Exclude current entity from parent options when editing
      if (entityId) {
        query = query.neq("id", entityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setParentOptions(data || []);
    } catch (error: any) {
      console.error("Error fetching parent options:", error);
    } finally {
      setLoadingParents(false);
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
      toast.error("Erro ao salvar entidade");
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
                placeholder="Código identificador"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                Tipo <span className="text-destructive">*</span>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_id">Entidade Pai</Label>
              <Select
                value={formData.parent_id}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                disabled={!formData.type || loadingParents || formData.type === "company"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    formData.type === "company" 
                      ? "Empresas não têm pai" 
                      : loadingParents 
                      ? "Carregando..." 
                      : "Selecione a entidade pai"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {parentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name} ({getTypeLabel(option.type)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.type && formData.type !== "company" && (
                <p className="text-xs text-muted-foreground">
                  {formData.type === "branch" && "Filiais devem ter uma Empresa como pai"}
                  {formData.type === "department" && "Departamentos devem ter uma Empresa ou Filial como pai"}
                  {formData.type === "area" && "Áreas devem ter uma Empresa, Filial ou Departamento como pai"}
                  {formData.type === "position" && "Cargos devem ter um Departamento ou Área como pai"}
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
