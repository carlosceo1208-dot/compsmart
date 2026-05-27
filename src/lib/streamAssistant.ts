import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface StreamAssistantOptions {
  /** Edge function name (e.g. 'legal-assistant') */
  functionName: string;
  /** JSON body to POST */
  body: Record<string, unknown>;
  /** Called as text chunks arrive */
  onDelta: (chunk: string) => void;
  /** Called once with full final metadata (from event: done) */
  onDone?: (meta: any) => void;
  /** Called if the server emits event: error */
  onError?: (errorMessage: string, status?: number) => void;
  /** Optional AbortSignal to cancel the stream */
  signal?: AbortSignal;
}

/**
 * Calls a Lovable Edge Function that returns text/event-stream and parses
 * `event: delta | done | error` events. Returns the final metadata or throws.
 */
export async function streamAssistant(opts: StreamAssistantOptions): Promise<any> {
  const { functionName, body, onDelta, onDone, onError, signal } = opts;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: token ? `Bearer ${token}` : `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  // Non-SSE error response (e.g. 401/500 before stream started)
  const ctype = res.headers.get('content-type') || '';
  if (!res.ok && !ctype.includes('text/event-stream')) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      errMsg = j.error || errMsg;
    } catch {
      try { errMsg = await res.text(); } catch { /* noop */ }
    }
    onError?.(errMsg, res.status);
    throw Object.assign(new Error(errMsg), { status: res.status });
  }

  if (!res.body) {
    throw new Error('Resposta sem corpo (stream indisponível)');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalMeta: any = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line ("\n\n")
    let sepIdx: number;
    while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);

      let evt = 'message';
      const dataLines: string[] = [];
      for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) evt = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
      }
      const dataStr = dataLines.join('\n');
      if (!dataStr) continue;

      let payload: any = null;
      try { payload = JSON.parse(dataStr); } catch { payload = { text: dataStr }; }

      if (evt === 'delta') {
        if (typeof payload?.text === 'string') onDelta(payload.text);
      } else if (evt === 'done') {
        finalMeta = payload;
        onDone?.(payload);
      } else if (evt === 'error') {
        const msg = payload?.error || 'Erro no servidor';
        onError?.(msg, payload?.status);
        throw Object.assign(new Error(msg), { status: payload?.status });
      }
    }
  }

  return finalMeta;
}
