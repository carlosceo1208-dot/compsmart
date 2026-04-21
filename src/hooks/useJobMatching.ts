import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface JobMatchingResult {
  id: string;
  job_title_id: string;
  matched_market_role: string;
  matched_cbo_code: string | null;
  match_score: number;
  reasoning: string | null;
  recommendations: string | null;
  market_median: number | null;
  internal_median: number | null;
  gap_pct: number | null;
  created_at: string;
  job_title?: { title: string; grade: string; code: string } | null;
}

export const useJobMatchingResults = () => {
  return useQuery({
    queryKey: ["job-matching-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_matching_results")
        .select(
          "*, job_title:job_titles!job_matching_results_job_title_id_fkey(title, grade, code)"
        )
        .order("match_score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as JobMatchingResult[];
    },
  });
};

export const useRunJobMatching = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobTitleId: string) => {
      const { data, error } = await supabase.functions.invoke(
        "job-matching-ai",
        { body: { jobTitleId } }
      );
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-matching-results"] });
      toast.success("Job matching concluído com sucesso");
    },
    onError: (e: Error) => {
      toast.error(`Falha no matching: ${e.message}`);
    },
  });
};
