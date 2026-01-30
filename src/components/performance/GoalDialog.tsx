import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePerformanceGoals, goalLevelLabels, type PerformanceGoal, type GoalLevel, type GoalStatus } from "@/hooks/usePerformanceGoals";
import { usePerformanceCycles } from "@/hooks/usePerformanceCycles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Loader2 } from "lucide-react";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: PerformanceGoal | null;
  defaultLevel?: GoalLevel;
  parentGoalId?: string;
}

export function GoalDialog({ open, onOpenChange, goal, defaultLevel, parentGoalId }: GoalDialogProps) {
  const { activeCompanyId } = useCompanyContext();
  const { createGoal, updateGoal } = usePerformanceGoals();
  const { cycles } = usePerformanceCycles({ status: "goals" });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: defaultLevel || "company" as GoalLevel,
    cycle_id: "",
    parent_goal_id: parentGoalId || "",
    target_value: "",
    current_value: "0",
    unit_of_measure: "",
    due_date: "",
    weight: "100",
    employee_id: "",
    unit_id: "",
  });

  const isEditing = !!goal;

  // Fetch employees for individual goals
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-goals", activeCompanyId],
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
    enabled: !!activeCompanyId && formData.level === "individual",
  });

  // Fetch units for area/department goals
  const { data: units } = useQuery({
    queryKey: ["units-for-goals", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const { data, error } = await supabase
        .from("organizational_structure")
        .select("id, description, code, type")
        .eq("root_company_id", activeCompanyId)
        .in("type", ["area", "department", "sector"])
        .order("type")
        .order("description");
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId && ["area", "department"].includes(formData.level),
  });

  // Fetch parent goals for cascading
  const { data: parentGoals } = useQuery({
    queryKey: ["parent-goals", activeCompanyId, formData.cycle_id, formData.level],
    queryFn: async () => {
      if (!activeCompanyId || !formData.cycle_id) return [];
      
      // Define which levels can be parent based on current level
      const parentLevels: Record<GoalLevel, GoalLevel[]> = {
        company: [],
        area: ["company"],
        department: ["company", "area"],
        position: ["company", "area", "department"],
        individual: ["company", "area", "department", "position"],
      };
      
      const validParentLevels = parentLevels[formData.level];
      if (validParentLevels.length === 0) return [];

      const { data, error } = await supabase
        .from("performance_goals")
        .select("id, title, level")
        .eq("root_company_id", activeCompanyId)
        .eq("cycle_id", formData.cycle_id)
        .in("level", validParentLevels)
        .order("level")
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId && !!formData.cycle_id && formData.level !== "company",
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || "",
        level: goal.level,
        cycle_id: goal.cycle_id,
        parent_goal_id: goal.parent_goal_id || "",
        target_value: goal.target_value?.toString() || "",
        current_value: goal.current_value?.toString() || "0",
        unit_of_measure: goal.unit_of_measure || "",
        due_date: goal.due_date || "",
        weight: goal.weight?.toString() || "100",
        employee_id: goal.employee_id || "",
        unit_id: goal.unit_id || "",
      });
    } else {
      // Set first active cycle as default
      if (cycles.length > 0 && !formData.cycle_id) {
        setFormData(prev => ({ ...prev, cycle_id: cycles[0].id }));
      }
    }
  }, [goal, cycles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const goalData = {
      title: formData.title,
      description: formData.description || null,
      level: formData.level,
      cycle_id: formData.cycle_id,
      parent_goal_id: formData.parent_goal_id || null,
      target_value: formData.target_value ? parseFloat(formData.target_value) : null,
      current_value: formData.current_value ? parseFloat(formData.current_value) : 0,
      unit_of_measure: formData.unit_of_measure || null,
      due_date: formData.due_date || null,
      weight: formData.weight ? parseFloat(formData.weight) : 100,
      employee_id: formData.level === "individual" ? formData.employee_id || null : null,
      unit_id: ["area", "department"].includes(formData.level) ? formData.unit_id || null : null,
    };

    if (isEditing && goal) {
      await updateGoal.mutateAsync({ id: goal.id, ...goalData });
    } else {
      await createGoal.mutateAsync(goalData);
    }

    onOpenChange(false);
  };

  const isPending = createGoal.isPending || updateGoal.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycle">Ciclo *</Label>
              <Select
                value={formData.cycle_id}
                onValueChange={(value) => setFormData({ ...formData, cycle_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ciclo" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Nível *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value as GoalLevel, parent_goal_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(goalLevelLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Aumentar receita em 20%"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a meta em detalhes..."
              rows={3}
            />
          </div>

          {formData.level !== "company" && parentGoals && parentGoals.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent_goal">Meta Pai (Cascateamento)</Label>
              <Select
                value={formData.parent_goal_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, parent_goal_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vincular a uma meta superior" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {parentGoals.map((pg) => (
                    <SelectItem key={pg.id} value={pg.id}>
                      [{goalLevelLabels[pg.level as GoalLevel]}] {pg.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.level === "individual" && employees.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="employee">Colaborador *</Label>
              <EmployeeCombobox
                employees={employees}
                value={formData.employee_id}
                onChange={(value) => setFormData({ ...formData, employee_id: value })}
                placeholder="Digite para buscar colaborador..."
              />
            </div>
          )}

          {["area", "department"].includes(formData.level) && units && (
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select
                value={formData.unit_id}
                onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.code} - {unit.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_value">Meta</Label>
              <Input
                id="target_value"
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_of_measure">Unidade</Label>
              <Input
                id="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                placeholder="%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (%)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                max="100"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
