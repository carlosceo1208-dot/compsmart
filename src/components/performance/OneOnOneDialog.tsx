import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePerformanceOneOnOnes, type PerformanceOneOnOne, type AgendaItem } from "@/hooks/usePerformanceOneOnOnes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

interface OneOnOneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oneOnOne?: PerformanceOneOnOne | null;
}

export function OneOnOneDialog({ open, onOpenChange, oneOnOne }: OneOnOneDialogProps) {
  const { activeCompanyId } = useCompanyContext();
  const { createOneOnOne, updateOneOnOne, parseAgendaItems } = usePerformanceOneOnOnes();

  const [formData, setFormData] = useState({
    employee_id: "",
    scheduled_date: "",
    notes: "",
  });

  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);

  const isEditing = !!oneOnOne;

  // Fetch employees (subordinates)
  const { data: employees = [] } = useQuery({
    queryKey: ["subordinates-for-1on1", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      
      const { data: userData } = await supabase.auth.getUser();
      
      // Get employees where current user is manager
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title")
        .eq("root_company_id", activeCompanyId)
        .eq("status", "active")
        .eq("manager_id", userData.user?.id)
        .order("full_name");
      
      if (error) throw error;
      
      // If no direct reports, show all active employees
      if (data.length === 0) {
        const { data: allEmps, error: allError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, job_title")
          .eq("root_company_id", activeCompanyId)
          .eq("status", "active")
          .neq("id", userData.user?.id)
          .order("full_name");
        if (allError) throw allError;
        return allEmps;
      }
      
      return data;
    },
    enabled: !!activeCompanyId && open,
  });

  useEffect(() => {
    if (oneOnOne) {
      setFormData({
        employee_id: oneOnOne.employee_id,
        scheduled_date: oneOnOne.scheduled_date,
        notes: oneOnOne.notes || "",
      });
      setAgendaItems(parseAgendaItems(oneOnOne.agenda_items));
    } else {
      setFormData({
        employee_id: "",
        scheduled_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setAgendaItems([]);
    }
  }, [oneOnOne]);

  const addAgendaItem = () => {
    setAgendaItems([
      ...agendaItems,
      { id: crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`, text: "", completed: false },
    ]);
  };

  const updateAgendaItem = (index: number, text: string) => {
    const updated = [...agendaItems];
    updated[index] = { ...updated[index], text };
    setAgendaItems(updated);
  };

  const removeAgendaItem = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      employee_id: formData.employee_id,
      scheduled_date: formData.scheduled_date,
      notes: formData.notes || null,
      agenda_items: agendaItems.filter(item => item.text.trim()) as unknown as any,
    };

    if (isEditing && oneOnOne) {
      await updateOneOnOne.mutateAsync({ id: oneOnOne.id, ...data });
    } else {
      await createOneOnOne.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isPending = createOneOnOne.isPending || updateOneOnOne.isPending;
  const selectedEmployee = employees?.find(e => e.id === formData.employee_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Reunião 1:1" : "Agendar Reunião 1:1"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Colaborador *</Label>
            <EmployeeCombobox
              employees={employees}
              value={formData.employee_id}
              onChange={(value) => setFormData({ ...formData, employee_id: value })}
              placeholder="Digite para buscar colaborador..."
            />
          </div>

          {selectedEmployee && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedEmployee.avatar_url || undefined} />
                <AvatarFallback>
                  {selectedEmployee.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedEmployee.full_name}</p>
                {selectedEmployee.job_title && (
                  <p className="text-xs text-muted-foreground">{selectedEmployee.job_title}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="scheduled_date">Data *</Label>
            <Input
              id="scheduled_date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              required
            />
          </div>

          {/* Agenda Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pauta</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAgendaItem}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            
            {agendaItems.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhum item na pauta
              </p>
            ) : (
              <div className="space-y-2">
                {agendaItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-5">{index + 1}.</span>
                    <Input
                      value={item.text}
                      onChange={(e) => updateAgendaItem(index, e.target.value)}
                      placeholder="Item da pauta..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => removeAgendaItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anotações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas sobre a reunião..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !formData.employee_id}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
