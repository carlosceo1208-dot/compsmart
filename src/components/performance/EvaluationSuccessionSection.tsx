import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Plus, X, Loader2 } from "lucide-react";
import { usePerformanceSuccession, readinessLabels, readinessColors, type Readiness } from "@/hooks/usePerformanceSuccession";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { toast } from "sonner";

interface EvaluationSuccessionSectionProps {
  employeeId: string;
  employeeName: string | null;
  isReadOnly: boolean;
}

export function EvaluationSuccessionSection({
  employeeId,
  employeeName,
  isReadOnly,
}: EvaluationSuccessionSectionProps) {
  const { activeCompanyId } = useCompanyContext();
  const { successions, createSuccession, deleteSuccession } = usePerformanceSuccession({
    successorEmployeeId: employeeId,
  });

  const [adding, setAdding] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [selectedReadiness, setSelectedReadiness] = useState<Readiness>("ready_1_year");

  // Fetch available key positions (job_titles used in succession)
  const { data: keyPositions = [] } = useQuery({
    queryKey: ["key-positions-for-succession", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const { data, error } = await supabase
        .from("job_titles")
        .select("id, title, grade, code")
        .eq("root_company_id", activeCompanyId)
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId,
  });

  const handleAdd = async () => {
    if (!selectedPositionId) return;

    // Check if already mapped
    const existing = successions.find(
      (s) => s.key_position_id === selectedPositionId
    );
    if (existing) {
      toast.error("Este colaborador já está mapeado para esta posição");
      return;
    }

    // Find next available rank
    const positionSuccessions = successions.filter(
      (s) => s.key_position_id === selectedPositionId
    );
    const nextRank = [1, 2, 3].find(
      (r) => !positionSuccessions.some((s) => s.rank === r)
    ) || 1;

    await createSuccession.mutateAsync({
      key_position_id: selectedPositionId,
      successor_employee_id: employeeId,
      readiness: selectedReadiness,
      rank: nextRank,
    });

    setAdding(false);
    setSelectedPositionId("");
  };

  const handleRemove = async (id: string) => {
    if (confirm("Remover indicação de sucessão?")) {
      await deleteSuccession.mutateAsync(id);
    }
  };

  // Positions already mapped for this employee
  const alreadyMappedIds = new Set(successions.map((s) => s.key_position_id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <UserPlus className="h-4 w-4 text-primary" />
          Indicação de Sucessor
        </Label>
        {!isReadOnly && !adding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Indicar
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {employeeName ?? "Este colaborador"} pode ser indicado como sucessor para posições-chave
      </p>

      {/* Existing mappings */}
      {successions.length > 0 ? (
        <div className="space-y-2">
          {successions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {s.key_position?.title ?? "Posição"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.key_position?.code} • Grade {s.key_position?.grade} • {s.rank}º lugar
                </p>
              </div>
              <Badge className={`text-[10px] ${readinessColors[s.readiness]}`}>
                {readinessLabels[s.readiness]}
              </Badge>
              {!isReadOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleRemove(s.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !adding && (
          <p className="text-xs text-muted-foreground italic">
            Nenhuma indicação de sucessão registrada
          </p>
        )
      )}

      {/* Add form */}
      {adding && (
        <div className="p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Posição-chave</Label>
            <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecione um cargo..." />
              </SelectTrigger>
              <SelectContent>
                {keyPositions
                  .filter((p) => !alreadyMappedIds.has(p.id))
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.title} ({p.code} • G{p.grade})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Prontidão</Label>
            <Select value={selectedReadiness} onValueChange={(v) => setSelectedReadiness(v as Readiness)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(readinessLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAdd}
              disabled={!selectedPositionId || createSuccession.isPending}
            >
              {createSuccession.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => {
                setAdding(false);
                setSelectedPositionId("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
