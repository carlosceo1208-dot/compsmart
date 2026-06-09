import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

export type EventCategory = 'navigation' | 'feature' | 'action' | 'system';

export interface TrackEventInput {
  event_name: string;
  event_category: EventCategory;
  module_name?: string;
  metadata?: Record<string, unknown>;
  duration_ms?: number;
}

/**
 * Telemetria interna nativa do CompSmart — LGPD-safe.
 * Eventos são gravados na própria base de dados (isolada por tenant via RLS).
 * Fire-and-forget: nunca quebra a UI se falhar.
 *
 * NÃO registrar: emails, nomes, CPF, salários, valores monetários.
 * Apenas: nome da ação, módulo, métricas anônimas.
 */
export const useTrackEvent = () => {
  const { activeCompanyId } = useCompanyContext();

  const track = useCallback(
    async (input: TrackEventInput) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !activeCompanyId) return;

        // Sanitiza metadata — remove possíveis chaves sensíveis acidentais
        const safeMeta = sanitizeMetadata(input.metadata ?? {});

        await supabase.from('usage_events').insert({
          company_id: activeCompanyId,
          user_id: user.id,
          event_name: input.event_name,
          event_category: input.event_category,
          module_name: input.module_name ?? null,
          metadata: safeMeta,
          duration_ms: input.duration_ms ?? null,
          route_path: window.location.pathname,
          user_agent: navigator.userAgent.slice(0, 255),
        });
      } catch (err) {
        // Telemetria não pode quebrar a aplicação
        if (import.meta.env.DEV) console.warn('[telemetry] track failed:', err);
      }
    },
    [activeCompanyId]
  );

  return { track };
};

const SENSITIVE_KEYS = /^(email|cpf|name|nome|salary|salario|password|senha|token|cnpj|phone|telefone)/i;

function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.test(k)) continue;
    if (typeof v === 'string' && v.length > 200) {
      out[k] = v.slice(0, 200);
    } else if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) {
      out[k] = v;
    }
  }
  return out;
}
