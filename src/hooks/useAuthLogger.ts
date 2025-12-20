import { supabase } from "@/integrations/supabase/client";

type AttemptType = "login" | "signup" | "password_reset" | "mfa_verify";

interface LogAuthAttemptParams {
  email: string;
  attemptType: AttemptType;
  success: boolean;
  failureReason?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Hook para registrar tentativas de autenticação para auditoria de segurança.
 * Os logs são enviados de forma assíncrona e silenciosa - erros não interrompem o fluxo.
 */
export function useAuthLogger() {
  const logAuthAttempt = async (params: LogAuthAttemptParams): Promise<void> => {
    try {
      // Fire and forget - não bloqueia o fluxo de autenticação
      await supabase.functions.invoke("log-auth-attempt", {
        body: {
          email: params.email,
          user_id: params.userId,
          attempt_type: params.attemptType,
          success: params.success,
          failure_reason: params.failureReason,
          metadata: params.metadata,
        },
      });
    } catch (error) {
      // Silent failure - logging should never break authentication
      console.debug("Auth logging failed (silent):", error);
    }
  };

  return { logAuthAttempt };
}
