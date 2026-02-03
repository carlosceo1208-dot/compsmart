import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ExternalFeedbackStatus = Database["public"]["Enums"]["external_feedback_status"];
type ExternalEvaluatorType = Database["public"]["Enums"]["external_evaluator_type"];

export interface ExternalFeedbackRequest {
  id: string;
  root_company_id: string;
  cycle_id: string | null;
  employee_id: string;
  requested_by: string;
  external_name: string;
  external_email: string;
  external_type: ExternalEvaluatorType;
  token: string;
  deadline: string;
  status: ExternalFeedbackStatus;
  template_questions: Array<{
    id: string;
    question: string;
    type: "rating" | "text";
  }> | null;
  custom_message: string | null;
  created_at: string;
  sent_at: string | null;
  completed_at: string | null;
  updated_at: string;
  // Joined data
  employee?: {
    full_name: string;
    job_title: string | null;
    avatar_url: string | null;
  };
  cycle?: {
    name: string;
  };
  requester?: {
    full_name: string;
  };
}

export interface CreateFeedbackRequestInput {
  root_company_id: string;
  cycle_id?: string;
  employee_id: string;
  requested_by: string;
  external_name: string;
  external_email: string;
  external_type: ExternalEvaluatorType;
  deadline: string;
  template_questions?: Array<{
    id: string;
    question: string;
    type: "rating" | "text";
  }>;
  custom_message?: string;
}

export const DEFAULT_CUSTOMER_QUESTIONS = [
  { id: "q1", question: "Como você avalia a qualidade do atendimento prestado?", type: "rating" as const },
  { id: "q2", question: "O colaborador demonstra conhecimento técnico adequado?", type: "rating" as const },
  { id: "q3", question: "Como é a comunicação e clareza nas interações?", type: "rating" as const },
  { id: "q4", question: "O colaborador cumpre prazos e compromissos?", type: "rating" as const },
  { id: "q5", question: "Você recomendaria trabalhar com este profissional?", type: "rating" as const },
];

export const DEFAULT_SUPPLIER_QUESTIONS = [
  { id: "q1", question: "Como você avalia a clareza nas negociações?", type: "rating" as const },
  { id: "q2", question: "O colaborador demonstra profissionalismo e ética?", type: "rating" as const },
  { id: "q3", question: "A comunicação é objetiva e respeitosa?", type: "rating" as const },
  { id: "q4", question: "Os compromissos acordados são cumpridos?", type: "rating" as const },
  { id: "q5", question: "Como é o relacionamento profissional de modo geral?", type: "rating" as const },
];

export function useExternalFeedbackRequests(filters?: {
  cycleId?: string;
  employeeId?: string;
  status?: ExternalFeedbackStatus;
}) {
  return useQuery({
    queryKey: ["external-feedback-requests", filters],
    queryFn: async () => {
      let query = supabase
        .from("external_feedback_requests")
        .select(`
          *,
          employee:profiles!external_feedback_requests_employee_id_fkey(full_name, job_title, avatar_url),
          cycle:performance_cycles(name),
          requester:profiles!external_feedback_requests_requested_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (filters?.cycleId) {
        query = query.eq("cycle_id", filters.cycleId);
      }
      if (filters?.employeeId) {
        query = query.eq("employee_id", filters.employeeId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as ExternalFeedbackRequest[];
    },
  });
}

export function useCreateFeedbackRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateFeedbackRequestInput) => {
      const { data, error } = await supabase
        .from("external_feedback_requests")
        .insert({
          root_company_id: input.root_company_id,
          cycle_id: input.cycle_id || null,
          employee_id: input.employee_id,
          requested_by: input.requested_by,
          external_name: input.external_name,
          external_email: input.external_email,
          external_type: input.external_type,
          deadline: input.deadline,
          template_questions: input.template_questions || [],
          custom_message: input.custom_message || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-feedback-requests"] });
      toast({
        title: "Solicitação criada",
        description: "A solicitação de feedback foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendFeedbackRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Usuário não autenticado");

      const response = await supabase.functions.invoke("send-external-feedback-request", {
        body: { requestId },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-feedback-requests"] });
      toast({
        title: "E-mail enviado",
        description: "A solicitação de feedback foi enviada por e-mail.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelFeedbackRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("external_feedback_requests")
        .update({ status: "cancelled" as ExternalFeedbackStatus })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-feedback-requests"] });
      toast({
        title: "Solicitação cancelada",
        description: "A solicitação foi cancelada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useExternalFeedbackKPIs() {
  return useQuery({
    queryKey: ["external-feedback-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_feedback_requests")
        .select("status");

      if (error) throw error;

      const total = data.length;
      const pending = data.filter((r) => r.status === "pending").length;
      const sent = data.filter((r) => r.status === "sent").length;
      const completed = data.filter((r) => r.status === "completed").length;
      const expired = data.filter((r) => r.status === "expired").length;

      return {
        total,
        pending,
        sent,
        completed,
        expired,
        responseRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    },
  });
}
