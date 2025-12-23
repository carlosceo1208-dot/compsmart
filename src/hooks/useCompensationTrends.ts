import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CompensationTrend {
  title: string;
  summary: string;
  source: string;
  category: "salários" | "benefícios" | "trabalho_remoto" | "tecnologia" | "liderança";
  detailed_analysis?: string;
  impact?: string;
  recommendations?: string[];
  search_terms?: string[];
}

interface TrendsResponse {
  trends: CompensationTrend[];
  error?: string;
}

export const useCompensationTrends = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["compensation-trends"],
    queryFn: async (): Promise<CompensationTrend[]> => {
      const { data, error } = await supabase.functions.invoke<TrendsResponse>("compensation-trends");

      if (error) {
        console.error("Error fetching trends:", error);
        throw new Error(error.message || "Erro ao buscar tendências");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.trends || [];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const refetch = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ["compensation-trends"] });
      toast({
        title: "Tendências atualizadas",
        description: "As tendências de remuneração foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as tendências. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return {
    trends: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    isFetching: query.isFetching,
  };
};
