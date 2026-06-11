import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePerformancePDI, pdiActionTypeLabels, type PerformancePDI, type PDIActionItem, type PDIStatus } from "@/hooks/usePerformancePDI";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

interface PDIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdi?: PerformancePDI | null;
  employeeId?: string;
}

export function PDIDialog({ open, onOpenChange, pdi, employeeId }: PDIDialogProps) {
  const { activeCompanyId } = useCompanyContext();
  const { createPDI, updatePDI, parseActionItems } = usePerformancePDI();

  const [formData, setFormData] = useState({
    employee_id: employeeId || "",
    title: "",
    description: "",
    due_date: "",
    status: "pending" as PDIStatus,
  });

  const [actionItems, setActionItems] = useState<PDIActionItem[]>([]);

  const isEditing = !!pdi;

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-pdi", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title")
        .eq("root_company_id", activeCompanyId)
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId && open,
  });

  // Fetch competencies
  const { data: competencies } = useQuery({
    queryKey: ["competencies-for-pdi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competencies")
        .select("id, name, type")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (pdi) {
      setFormData({
        employee_id: pdi.employee_id,
        title: pdi.title,
        description: pdi.description || "",
        due_date: pdi.due_date || "",
        status: pdi.status,
      });
      setActionItems(parseActionItems(pdi.action_items));
    } else {
      setFormData({
        employee_id: employeeId || "",
        title: "",
        description: "",
        due_date: "",
        status: "pending",
      });
      setActionItems([]);
    }
  }, [pdi, employeeId]);

  const addActionItem = () => {
    setActionItems([
      ...actionItems,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `action-${Date.now()}`,
        text: "",
        type: "training",
        completed: false,
      },
    ]);
  };

  const updateActionItem = (index: number, field: keyof PDIActionItem, value: any) => {
    const updated = [...actionItems];
    updated[index] = { ...updated[index], [field]: value };
    setActionItems(updated);
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      employee_id: formData.employee_id,
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null,
      status: formData.status,
      action_items: actionItems.filter(item => item.text.trim()) as unknown as any,
    };

    if (isEditing && pdi) {
      await updatePDI.mutateAsync({ id: pdi.id, ...data });
    } else {
      await createPDI.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isPending = createPDI.isPending || updatePDI.isPending;
  const selectedEmployee = employees?.find(e => e.id === formData.employee_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar PDI" : "Novo Plano de Desenvolvimento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Colaborador *</Label>
            <EmployeeCombobox
              employees={employees}
              value={formData.employee_id}
              onChange={(value) => setFormData({ ...formData, employee_id: value })}
              placeholder="Digite para buscar colaborador..."
              disabled={!!employeeId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Desenvolver habilidades de liderança"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o objetivo do plano de desenvolvimento..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Data Limite</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          {/* Action Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ações de Desenvolvimento</Label>
              <Button type="button" variant="outline" size="sm" onClick={addActionItem}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {actionItems.length === 0 ? (
              <div className="border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                Nenhuma ação adicionada
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Select
                        value={item.type}
                        onValueChange={(value) => updateActionItem(index, "type", value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(pdiActionTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={item.text}
                        onChange={(e) => updateActionItem(index, "text", e.target.value)}
                        placeholder="Descrição da ação..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => removeActionItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !formData.employee_id || !formData.title}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar PDI"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
