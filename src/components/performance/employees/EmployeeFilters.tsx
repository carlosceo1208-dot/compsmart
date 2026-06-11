import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";

interface EmployeeFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    unitId: string;
    evaluationStatus: string;
  }) => void;
}

export function EmployeeFilters({ onFiltersChange }: EmployeeFiltersProps) {
  const { activeCompanyId } = useCompanyContext();
  const [search, setSearch] = useState("");
  const [unitId, setUnitId] = useState("");
  const [evaluationStatus, setEvaluationStatus] = useState("");

  // Buscar unidades organizacionais
  const { data: units = [] } = useQuery({
    queryKey: ["org-units-filter", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      const { data, error } = await supabase
        .from("organizational_structure")
        .select("id, description, type")
        .eq("root_company_id", activeCompanyId)
        .in("type", ["area", "department", "sector"])
        .order("description");

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeCompanyId,
  });

  useEffect(() => {
    onFiltersChange({ search, unitId, evaluationStatus });
  }, [search, unitId, evaluationStatus, onFiltersChange]);

  const clearFilters = () => {
    setSearch("");
    setUnitId("");
    setEvaluationStatus("");
  };

  const hasFilters = search || unitId || evaluationStatus;

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar colaborador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={unitId} onValueChange={setUnitId}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Unidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as unidades</SelectItem>
          {units.map((unit) => (
            <SelectItem key={unit.id} value={unit.id}>
              {unit.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={evaluationStatus} onValueChange={setEvaluationStatus}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Status avaliação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="draft">Rascunho</SelectItem>
          <SelectItem value="in_progress">Em andamento</SelectItem>
          <SelectItem value="completed">Concluída</SelectItem>
          <SelectItem value="approved">Aprovada</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
