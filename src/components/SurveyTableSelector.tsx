import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, FolderOpen } from "lucide-react";

interface SurveyTable {
  id: string;
  name: string;
  effective_month: number;
  effective_year: number;
  is_active: boolean;
  root_company_id: string | null;
}

interface SurveyTableSelectorProps {
  value: string | undefined;
  onChange: (value: string) => void;
  onTableChange?: (table: SurveyTable | null) => void;
}

const formatVigencia = (month: number, year: number) => {
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${monthNames[month - 1]}/${year}`;
};

export function SurveyTableSelector({ value, onChange, onTableChange }: SurveyTableSelectorProps) {
  const [tables, setTables] = useState<SurveyTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserCompany();
    fetchTables();
  }, []);

  const fetchUserCompany = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("root_company_id")
        .eq("id", user.id)
        .single();

      setUserCompanyId(profile?.root_company_id || null);
    } catch (error) {
      console.error("Error fetching user company:", error);
    }
  };

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from("survey_tables")
        .select("id, name, effective_month, effective_year, is_active, root_company_id")
        .order("is_active", { ascending: false })
        .order("effective_year", { ascending: false })
        .order("effective_month", { ascending: false });

      if (error) throw error;

      setTables(data || []);

      // Auto-select active table or first table if no value is set
      if (!value && data && data.length > 0) {
        const activeTable = data.find((t) => t.is_active);
        const selectedId = activeTable?.id || data[0].id;
        onChange(selectedId);
        if (onTableChange) {
          onTableChange(activeTable || data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching survey tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (onTableChange) {
      const selectedTable = tables.find(t => t.id === newValue) || null;
      onTableChange(selectedTable);
    }
  };

  // Separar em templates CompSmart e pesquisas da empresa
  const compsmartTemplates = tables.filter(t => t.root_company_id === null);
  const myTables = tables.filter(t => t.root_company_id !== null && t.root_company_id === userCompanyId);

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
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione uma pesquisa" />
      </SelectTrigger>
      <SelectContent>
        {myTables.length > 0 && (
          <SelectGroup>
            <SelectLabel className="flex items-center gap-2 text-primary">
              <FolderOpen className="h-4 w-4" />
              MINHAS PESQUISAS
            </SelectLabel>
            {myTables.map((table) => (
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
          </SelectGroup>
        )}

        {compsmartTemplates.length > 0 && (
          <SelectGroup>
            <SelectLabel className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mt-2">
              <Building2 className="h-4 w-4" />
              PESQUISAS COMPSMART
            </SelectLabel>
            {compsmartTemplates.map((table) => (
              <SelectItem key={table.id} value={table.id}>
                <div className="flex items-center gap-2">
                  <span>{table.name}</span>
                  <span className="text-muted-foreground text-sm">
                    - {formatVigencia(table.effective_month, table.effective_year)}
                  </span>
                  <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600 dark:text-amber-400">
                    Template
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
