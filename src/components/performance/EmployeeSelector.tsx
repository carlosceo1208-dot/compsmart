import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeCombobox, type Employee } from "@/components/EmployeeCombobox";
import { useCompanyContext } from "@/contexts/CompanyContext";

interface EmployeeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];
  showGrade?: boolean;
}

export function EmployeeSelector({
  value,
  onChange,
  placeholder = "Selecione o colaborador",
  disabled = false,
  excludeIds = [],
  showGrade = false,
}: EmployeeSelectorProps) {
  const { activeCompanyId } = useCompanyContext();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-selector", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title, grade, employee_number")
        .eq("root_company_id", activeCompanyId)
        .eq("status", "active")
        .order("full_name");

      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!activeCompanyId,
  });

  return (
    <EmployeeCombobox
      employees={employees}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      excludeIds={excludeIds}
      showGrade={showGrade}
    />
  );
}
