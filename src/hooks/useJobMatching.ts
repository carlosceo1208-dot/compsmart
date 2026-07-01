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
  final_reasoning: string | null;
  ai_original_score: number | null;
  ai_original_reasoning: string | null;
  market_median: number | null;
  internal_median: number | null;
  gap_pct: number | null;
  version: number;
  review_status: "pending" | "approved" | "corrected" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  job_title?: { title: string; grade: string; code: string } | null;
}

export interface JobMatchingHistoryEntry {
  id: string;
  job_title_id: string;
  version: number;
  source: "ai" | "human_review";
  matched_market_role: string;
  matched_cbo_code: string | null;
  match_score: number;
  reasoning: string | null;
  recommendations: string | null;
  market_median: number | null;
  internal_median: number | null;
  gap_pct: number | null;
  parameters: Record<string, unknown> | null;
  review_notes: string | null;
  created_by: string | null;
  created_at: string;
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

export const useJobMatchingHistory = (jobTitleId: string | null) => {
  return useQuery({
    queryKey: ["job-matching-history", jobTitleId],
    enabled: !!jobTitleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_matching_history")
        .select("*")
        .eq("job_title_id", jobTitleId!)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as JobMatchingHistoryEntry[];
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
    onSuccess: (_d, jobTitleId) => {
      qc.invalidateQueries({ queryKey: ["job-matching-results"] });
      qc.invalidateQueries({ queryKey: ["job-matching-history", jobTitleId] });
      toast.success("Job matching concluído com sucesso");
    },
    onError: (e: Error) => toast.error(`Falha no matching: ${e.message}`),
  });
};

interface ReviewPayload {
  resultId: string;
  jobTitleId: string;
  status: "approved" | "corrected" | "rejected";
  finalReasoning?: string;
  correctedScore?: number;
  reviewNotes?: string;
  rootCompanyId: string;
  matchedMarketRole: string;
  matchedCboCode: string | null;
  recommendations: string | null;
  marketMedian: number | null;
  internalMedian: number | null;
  gapPct: number | null;
  currentVersion: number;
}

export const useReviewJobMatching = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: ReviewPayload) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const isCorrection = p.status === "corrected";
      const newVersion = isCorrection ? p.currentVersion + 1 : p.currentVersion;

      const updates: Record<string, unknown> = {
        review_status: p.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
        review_notes: p.reviewNotes ?? null,
      };
      if (p.finalReasoning !== undefined) {
        updates.final_reasoning = p.finalReasoning;
        updates.reasoning = p.finalReasoning;
      }
      if (isCorrection && typeof p.correctedScore === "number") {
        updates.match_score = Math.max(0, Math.min(100, p.correctedScore));
        updates.version = newVersion;
      }

      const { error: upErr } = await supabase
        .from("job_matching_results")
        .update(updates as never)
        .eq("id", p.resultId);
      if (upErr) throw upErr;

      // Append history entry for the review action
      const { error: histErr } = await supabase
        .from("job_matching_history")
        .insert({
          root_company_id: p.rootCompanyId,
          job_title_id: p.jobTitleId,
          version: newVersion,
          source: "human_review",
          matched_market_role: p.matchedMarketRole,
          matched_cbo_code: p.matchedCboCode,
          match_score:
            isCorrection && typeof p.correctedScore === "number"
              ? Math.max(0, Math.min(100, p.correctedScore))
              : 0, // placeholder if not corrected; UI uses status from results
          reasoning: p.finalReasoning ?? null,
          recommendations: p.recommendations,
          market_median: p.marketMedian,
          internal_median: p.internalMedian,
          gap_pct: p.gapPct,
          parameters: { action: p.status },
          review_notes: p.reviewNotes ?? null,
          created_by: userId,
        });
      if (histErr) throw histErr;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["job-matching-results"] });
      qc.invalidateQueries({
        queryKey: ["job-matching-history", vars.jobTitleId],
      });
      toast.success("Revisão registrada");
    },
    onError: (e: Error) => toast.error(`Erro ao revisar: ${e.message}`),
  });
};
