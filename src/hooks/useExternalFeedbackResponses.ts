import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface FeedbackAnswer {
  questionId: string;
  question: string;
  rating?: number;
  text?: string;
}

export interface ExternalFeedbackResponse {
  id: string;
  request_id: string;
  answers: FeedbackAnswer[];
  overall_rating: number | null;
  strengths: string | null;
  improvement_areas: string | null;
  additional_comments: string | null;
  created_at: string;
  // Joined data from request
  request?: {
    external_name: string;
    external_email: string;
    external_type: string;
    employee: {
      full_name: string;
      job_title: string | null;
    };
  };
}

function parseAnswers(answers: Json): FeedbackAnswer[] {
  if (Array.isArray(answers)) {
    return answers.map((a) => {
      if (typeof a === "object" && a !== null) {
        return {
          questionId: String((a as Record<string, unknown>).questionId || ""),
          question: String((a as Record<string, unknown>).question || ""),
          rating: typeof (a as Record<string, unknown>).rating === "number" ? (a as Record<string, unknown>).rating as number : undefined,
          text: typeof (a as Record<string, unknown>).text === "string" ? (a as Record<string, unknown>).text as string : undefined,
        };
      }
      return { questionId: "", question: "" };
    });
  }
  return [];
}

export function useExternalFeedbackResponses(requestId?: string) {
  return useQuery({
    queryKey: ["external-feedback-responses", requestId],
    queryFn: async () => {
      let query = supabase
        .from("external_feedback_responses")
        .select(`
          *,
          request:external_feedback_requests(
            external_name,
            external_email,
            external_type,
            employee:profiles!external_feedback_requests_employee_id_fkey(full_name, job_title)
          )
        `)
        .order("created_at", { ascending: false });

      if (requestId) {
        query = query.eq("request_id", requestId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our interface
      return data.map((item) => ({
        ...item,
        answers: parseAnswers(item.answers),
      })) as ExternalFeedbackResponse[];
    },
  });
}
