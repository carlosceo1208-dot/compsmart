import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate, Json } from "@/integrations/supabase/types";

export type PerformanceTemplate = Tables<"performance_templates">;
export type PerformanceTemplateInsert = TablesInsert<"performance_templates">;
export type PerformanceTemplateUpdate = TablesUpdate<"performance_templates">;

// Define the structure of indicators in the template
export interface TemplateIndicator {
  id: string;
  name: string;
  description?: string;
  weight: number;
}

interface UseTemplatesOptions {
  includeGlobal?: boolean;
  includeInactive?: boolean;
  templateType?: string;
}

export function usePerformanceTemplates(options: UseTemplatesOptions = {}) {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ["performance-templates", activeCompanyId, options],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      let query = supabase
        .from("performance_templates")
        .select("*")
        .order("name");

      // Filter by company OR global templates
      if (options.includeGlobal) {
        query = query.or(`root_company_id.eq.${activeCompanyId},is_global.eq.true`);
      } else {
        query = query.eq("root_company_id", activeCompanyId);
      }

      if (!options.includeInactive) {
        query = query.eq("is_active", true);
      }

      if (options.templateType) {
        query = query.eq("template_type", options.templateType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PerformanceTemplate[];
    },
    enabled: !!activeCompanyId,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<PerformanceTemplateInsert, "root_company_id">) => {
      if (!activeCompanyId) throw new Error("Empresa não selecionada");

      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("performance_templates")
        .insert({
          ...template,
          root_company_id: activeCompanyId,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-templates"] });
      toast.success("Modelo criado com sucesso");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("Erro ao criar modelo");
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: PerformanceTemplateUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("performance_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-templates"] });
      toast.success("Modelo atualizado com sucesso");
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast.error("Erro ao atualizar modelo");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("performance_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-templates"] });
      toast.success("Modelo excluído com sucesso");
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("Erro ao excluir modelo");
    },
  });

  // Helper to parse indicators from JSON
  const parseIndicators = (indicators: Json | null): TemplateIndicator[] => {
    if (!indicators || !Array.isArray(indicators)) return [];
    return indicators as unknown as TemplateIndicator[];
  };

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    refetch: templatesQuery.refetch,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    parseIndicators,
  };
}

// Template type labels
export const templateTypeLabels: Record<string, string> = {
  standard: "Padrão",
  leadership: "Liderança",
  sales: "Vendas",
  technical: "Técnico",
  operational: "Operacional",
  administrative: "Administrativo",
};
