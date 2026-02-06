import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  usePerformanceSuccession, 
  readinessLabels, 
  rankLabels,
  rankIcons,
  type PerformanceSuccession, 
  type Readiness 
} from "@/hooks/usePerformanceSuccession";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";
import { toast } from "sonner";
import { SuccessorPerformanceCard } from "./SuccessorPerformanceCard";

interface SuccessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  succession?: PerformanceSuccession | null;
  preselectedPositionId?: string;
  preselectedRank?: number;
}

export function SuccessionDialog({ 
  open, 
  onOpenChange, 
  succession, 
  preselectedPositionId,
  preselectedRank 
}: SuccessionDialogProps) {
  const { activeCompanyId } = useCompanyContext();
  const { createSuccession, updateSuccession, successions } = usePerformanceSuccession();

  const [formData, setFormData] = useState({
    key_position_id: "",
    successor_employee_id: "",
    readiness: "development" as Readiness,
    rank: 1,
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
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-succession", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title, grade, job_title_id")
        .eq("root_company_id", activeCompanyId)
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId && open,
  });

  // Fetch competencies for position
  const { data: positionCompetencies } = useQuery({
    queryKey: ["position-competencies", formData.key_position_id],
    queryFn: async () => {
      if (!formData.key_position_id) return [];
      const { data, error } = await supabase
        .from("job_title_competencies")
        .select(`
          competency:competencies(id, name, type),
          required_level
        `)
        .eq("job_title_id", formData.key_position_id);
      if (error) throw error;
      return data;
    },
    enabled: !!formData.key_position_id && open,
  });

  // Fetch current competencies for employee
  const { data: employeeCompetencies } = useQuery({
    queryKey: ["employee-competencies", formData.successor_employee_id, employees],
    queryFn: async () => {
      const employee = employees?.find(e => e.id === formData.successor_employee_id);
      if (!employee?.job_title_id) return [];
      const { data, error } = await supabase
        .from("job_title_competencies")
        .select(`
          competency:competencies(id, name, type),
          required_level
        `)
        .eq("job_title_id", employee.job_title_id);
      if (error) throw error;
      return data;
    },
    enabled: !!formData.successor_employee_id && employees.length > 0 && open,
  });

  // Calculate competency gaps
  const competencyGaps = positionCompetencies?.filter(pc => {
    const employeeComp = employeeCompetencies?.find(
      ec => ec.competency?.id === pc.competency?.id
    );
    return !employeeComp || (employeeComp.required_level || 0) < (pc.required_level || 0);
  }) || [];

  // Get existing ranks for the selected position
  const existingRanksForPosition = successions
    .filter(s => s.key_position_id === formData.key_position_id && s.id !== succession?.id)
    .map(s => s.rank);

  // Get available ranks
  const availableRanks = [1, 2, 3].filter(r => !existingRanksForPosition.includes(r));

  useEffect(() => {
    if (succession) {
      setFormData({
        key_position_id: succession.key_position_id,
        successor_employee_id: succession.successor_employee_id,
        readiness: succession.readiness,
        rank: succession.rank || 1,
        development_plan: succession.development_plan || "",
        notes: succession.notes || "",
      });
    } else {
      setFormData({
        key_position_id: preselectedPositionId || "",
        successor_employee_id: "",
        readiness: "development",
        rank: preselectedRank || 1,
        development_plan: "",
        notes: "",
      });
    }
  }, [succession, preselectedPositionId, preselectedRank]);

  // Update rank when position changes to first available
  useEffect(() => {
    if (!isEditing && formData.key_position_id) {
      const newAvailableRanks = [1, 2, 3].filter(r => 
        !successions
          .filter(s => s.key_position_id === formData.key_position_id)
          .map(s => s.rank)
          .includes(r)
      );
      if (newAvailableRanks.length > 0 && !newAvailableRanks.includes(formData.rank)) {
        setFormData(prev => ({ ...prev, rank: newAvailableRanks[0] }));
      }
    }
  }, [formData.key_position_id, successions, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate max 3 successors per position
    if (!isEditing && existingRanksForPosition.length >= 3) {
      toast.error("Esta posição já possui 3 sucessores mapeados");
      return;
    }

    // Validate rank is available
    if (!isEditing && existingRanksForPosition.includes(formData.rank)) {
      toast.error("Este ranking já está ocupado para esta posição");
      return;
    }

    const data = {
      key_position_id: formData.key_position_id,
      successor_employee_id: formData.successor_employee_id,
      readiness: formData.readiness,
      rank: formData.rank,
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

  const positionIsFull = !isEditing && existingRanksForPosition.length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Mapeamento" : "Mapear Sucessão"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Posição-Chave *</Label>
            <Select
              value={formData.key_position_id}
              onValueChange={(value) => setFormData({ ...formData, key_position_id: value })}
              disabled={!!preselectedPositionId}
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
              {existingRanksForPosition.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {existingRanksForPosition.length}/3 sucessores mapeados
                </p>
              )}
            </div>
          )}

          {positionIsFull && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-300">
                Esta posição já possui o máximo de 3 sucessores
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Ranking de Prioridade *</Label>
            <Select
              value={formData.rank.toString()}
              onValueChange={(value) => setFormData({ ...formData, rank: parseInt(value) })}
              disabled={availableRanks.length === 0 && !isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3].map((rank) => {
                  const isAvailable = availableRanks.includes(rank) || (isEditing && succession?.rank === rank);
                  return (
                    <SelectItem 
                      key={rank} 
                      value={rank.toString()}
                      disabled={!isAvailable}
                    >
                      <span className="flex items-center gap-2">
                        <span>{rankIcons[rank]}</span>
                        <span>{rankLabels[rank]}</span>
                        {!isAvailable && <span className="text-muted-foreground">(ocupado)</span>}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Potencial Sucessor *</Label>
            <EmployeeCombobox
              employees={employees}
              value={formData.successor_employee_id}
              onChange={(value) => setFormData({ ...formData, successor_employee_id: value })}
              placeholder="Digite para buscar colaborador..."
              showGrade
            />
          </div>

          {selectedEmployee && (
            <div className="space-y-3">
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
              
              {/* Performance History Card */}
              <SuccessorPerformanceCard employeeId={selectedEmployee.id} />
            </div>
          )}

          {/* Competency Gaps Section */}
          {selectedEmployee && selectedPosition && competencyGaps.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Gaps de Competências Identificados
              </Label>
              <Card className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30">
                <div className="flex flex-wrap gap-2">
                  {competencyGaps.map((gap, idx) => (
                    <Badge key={idx} variant="outline" className="bg-background">
                      {gap.competency?.name}
                      <span className="ml-1 text-muted-foreground">
                        (Nível {gap.required_level})
                      </span>
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  O sucessor precisa desenvolver estas competências para a posição-chave
                </p>
              </Card>
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
            <Label htmlFor="development_plan">
              Plano de Desenvolvimento
              {competencyGaps.length > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Considere os gaps acima)
                </span>
              )}
            </Label>
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
              disabled={isPending || !formData.key_position_id || !formData.successor_employee_id || positionIsFull}
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