import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  usePerformanceSuccession, 
  readinessLabels, 
  type PerformanceSuccession, 
  type Readiness 
} from "@/hooks/usePerformanceSuccession";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Loader2 } from "lucide-react";

interface SuccessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  succession?: PerformanceSuccession | null;
}

export function SuccessionDialog({ open, onOpenChange, succession }: SuccessionDialogProps) {
  const { activeCompanyId } = useCompanyContext();
  const { createSuccession, updateSuccession } = usePerformanceSuccession();

  const [formData, setFormData] = useState({
    key_position_id: "",
    successor_employee_id: "",
    readiness: "development" as Readiness,
    development_plan: "",
    notes: "",
  });

  const isEditing = !!succession;

  // Fetch job titles (key positions)
  const { data: jobTitles } = useQuery({
    queryKey: ["job-titles-for-succession", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const { data, error } = await supabase
        .from("job_titles")
        .select("id, title, grade, code")
        .eq("root_company_id", activeCompanyId)
        .eq("is_active", true)
        .order("grade")
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId && open,
  });

  // Fetch employees (potential successors)
  const { data: employees } = useQuery({
    queryKey: ["employees-for-succession", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title, grade")
        .eq("root_company_id", activeCompanyId)
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId && open,
  });

  useEffect(() => {
    if (succession) {
      setFormData({
        key_position_id: succession.key_position_id,
        successor_employee_id: succession.successor_employee_id,
        readiness: succession.readiness,
        development_plan: succession.development_plan || "",
        notes: succession.notes || "",
      });
    } else {
      setFormData({
        key_position_id: "",
        successor_employee_id: "",
        readiness: "development",
        development_plan: "",
        notes: "",
      });
    }
  }, [succession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      key_position_id: formData.key_position_id,
      successor_employee_id: formData.successor_employee_id,
      readiness: formData.readiness,
      development_plan: formData.development_plan || null,
      notes: formData.notes || null,
    };

    if (isEditing && succession) {
      await updateSuccession.mutateAsync({ id: succession.id, ...data });
    } else {
      await createSuccession.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isPending = createSuccession.isPending || updateSuccession.isPending;
  const selectedEmployee = employees?.find(e => e.id === formData.successor_employee_id);
  const selectedPosition = jobTitles?.find(j => j.id === formData.key_position_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Mapeamento" : "Mapear Sucessão"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Posição-Chave *</Label>
            <Select
              value={formData.key_position_id}
              onValueChange={(value) => setFormData({ ...formData, key_position_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a posição" />
              </SelectTrigger>
              <SelectContent>
                {jobTitles?.map((jt) => (
                  <SelectItem key={jt.id} value={jt.id}>
                    <span className="font-medium">{jt.title}</span>
                    <span className="text-muted-foreground ml-2">
                      ({jt.code} - Grade {jt.grade})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPosition && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium">{selectedPosition.title}</p>
              <p className="text-xs text-muted-foreground">
                {selectedPosition.code} • Grade {selectedPosition.grade}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Potencial Sucessor *</Label>
            <Select
              value={formData.successor_employee_id}
              onValueChange={(value) => setFormData({ ...formData, successor_employee_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o colaborador" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={emp.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {emp.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{emp.full_name}</span>
                      {emp.grade && (
                        <span className="text-xs text-muted-foreground">
                          (Grade {emp.grade})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <p className="text-xs text-muted-foreground">
                    {selectedEmployee.job_title} • Grade {selectedEmployee.grade}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Nível de Prontidão *</Label>
            <Select
              value={formData.readiness}
              onValueChange={(value) => setFormData({ ...formData, readiness: value as Readiness })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(readinessLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="development_plan">Plano de Desenvolvimento</Label>
            <Textarea
              id="development_plan"
              value={formData.development_plan}
              onChange={(e) => setFormData({ ...formData, development_plan: e.target.value })}
              placeholder="Descreva as ações necessárias para preparar o sucessor..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !formData.key_position_id || !formData.successor_employee_id}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Mapear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
