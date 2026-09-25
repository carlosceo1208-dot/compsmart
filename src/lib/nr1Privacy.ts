/**
 * Privacidade & LGPD para o módulo NR-1.
 *
 * - K-anonimato: nenhum recorte com menos de K respondentes deve ser exibido.
 *   Para NR-1 (saúde mental + dado sensível), o piso recomendado é K = 5.
 * - Logging: registrar todo acesso a dado sensível em `nr1_access_log`.
 */

import { supabase } from '@/integrations/supabase/client';

export const K_ANONIMATO_MINIMO = 5;

/**
 * Tenta extrair o "n" de um rótulo no formato "Tecnologia (6)" → 6.
 * Retorna null quando não houver contagem embutida.
 */
export function extrairN(rotulo: string): number | null {
  const m = rotulo.match(/\((\d+)\)\s*$/);
  return m ? Number(m[1]) : null;
}

type LinhaComN<T> = T & { rotulo: string };

/**
 * Aplica k-anonimato a uma lista de linhas com `rotulo` que contém o n
 * embutido (ex.: "Não-binário (1)"). Retorna apenas as linhas com n ≥ k.
 * Se não houver `n` embutido, a linha é mantida (assume agregada).
 */
export function aplicarKAnonimato<T extends { rotulo: string }>(
  linhas: T[],
  k: number = K_ANONIMATO_MINIMO,
): { visiveis: T[]; suprimidas: T[]; kAplicado: number } {
  const visiveis: T[] = [];
  const suprimidas: T[] = [];
  for (const l of linhas) {
    const n = extrairN(l.rotulo);
    if (n != null && n < k) suprimidas.push(l);
    else visiveis.push(l);
  }
  return { visiveis, suprimidas, kAplicado: k };
}

/**
 * Registra acesso a dado sensível no log de auditoria.
 * Falha silenciosamente — auditoria nunca deve quebrar a UX.
 */
export async function registrarAcessoNr1(params: {
  companyId: string;
  actorRole: string;
  action: 'view_dashboard' | 'view_recorte' | 'export_csv' | 'export_pdf' | 'view_individual_attempt';
  resource: string;
  filters?: Record<string, unknown>;
  kValue?: number;
  blocked?: boolean;
  reason?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from('nr1_access_log').insert({
      company_id: params.companyId,
      actor_user_id: user.id,
      actor_role: params.actorRole,
      action: params.action,
      resource: params.resource,
      filters: params.filters ?? null,
      k_value: params.kValue ?? null,
      blocked: params.blocked ?? false,
      reason: params.reason ?? null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
  } catch {
    /* noop — auditoria nunca quebra UX */
  }
}
