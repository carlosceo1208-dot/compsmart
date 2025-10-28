import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SurveyTable {
  id: string;
  name: string;
  effective_month: number;
  effective_year: number;
  is_active: boolean;
}

interface SurveyTableSelectorProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

const formatVigencia = (month: number, year: number) => {
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${monthNames[month - 1]}/${year}`;
};

export function SurveyTableSelector({ value, onChange }: SurveyTableSelectorProps) {
  const [tables, setTables] = useState<SurveyTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from("survey_tables")
        .select("*")
        .order("is_active", { ascending: false })
        .order("effective_year", { ascending: false })
        .order("effective_month", { ascending: false });

      if (error) throw error;

      setTables(data || []);

      // Auto-select active table or first table if no value is set
      if (!value && data && data.length > 0) {
        const activeTable = data.find((t) => t.is_active);
        onChange(activeTable?.id || data[0].id);
      }
    } catch (error) {
      console.error("Error fetching survey tables:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Carregando pesquisas..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (tables.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Nenhuma pesquisa cadastrada" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione uma pesquisa" />
      </SelectTrigger>
      <SelectContent>
        {tables.map((table) => (
          <SelectItem key={table.id} value={table.id}>
            <div className="flex items-center gap-2">
              <span>{table.name}</span>
              <span className="text-muted-foreground text-sm">
                - {formatVigencia(table.effective_month, table.effective_year)}
              </span>
              {table.is_active && (
                <Badge variant="default" className="ml-2">
                  Ativa
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
