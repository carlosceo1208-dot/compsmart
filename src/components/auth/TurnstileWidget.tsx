import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const TURNSTILE_SITE_KEY = "0x4AAAAAAFJIAO_pENlxDUF6";
const MAX_RETRIES = 3;

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  onLoading?: (isLoading: boolean) => void;
  /** Mude este número para pedir um token novo ao widget existente (reset, sem redesenhar). */
  resetSignal?: number;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback': () => void;
        'expired-callback': () => void;
        size?: 'normal' | 'compact' | 'flexible';
        theme?: 'light' | 'dark' | 'auto';
        retry?: 'auto' | 'never';
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export function TurnstileWidget({ onVerify, onError, onExpire, onLoading, resetSignal = 0 }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const retriesRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const aliveRef = useRef(true);
  // Callbacks sempre atuais sem provocar novo desenho do widget
  const cb = useRef({ onVerify, onError, onExpire, onLoading });
  cb.current = { onVerify, onError, onExpire, onLoading };
  const [isLoading, setIsLoading] = useState(true);
  // Incrementa para refazer a carga do script quando o widget nunca desenhou
  const [attempt, setAttempt] = useState(0);

  const setLoading = (v: boolean) => { if (!aliveRef.current) return; setIsLoading(v); cb.current.onLoading?.(v); };

  // Carrega o script e desenha o widget UMA vez por montagem
  useEffect(() => {
    aliveRef.current = true;
    const later = (fn: () => void, ms: number) => { timersRef.current.push(window.setTimeout(fn, ms)); };

    const render = () => {
      if (!aliveRef.current || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'auto',
        retry: 'never',
        callback: (token) => { if (!aliveRef.current) return; retriesRef.current = 0; setLoading(false); cb.current.onVerify(token); },
        'error-callback': () => {
          if (!aliveRef.current) return;
          if (retriesRef.current < MAX_RETRIES - 1) {
            retriesRef.current += 1;
            later(() => { if (aliveRef.current && widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current); }, 1000);
          } else { setLoading(false); cb.current.onError?.(); }
        },
        'expired-callback': () => { if (!aliveRef.current) return; setLoading(false); cb.current.onExpire?.(); },
      });
    };

    later(() => { if (!window.turnstile) { setLoading(false); cb.current.onError?.(); } }, 15000);

    if (window.turnstile) render();
    else {
      const prev = window.onTurnstileLoad;
      window.onTurnstileLoad = () => { prev?.(); render(); };
      // Em nova tentativa, remove script antigo (pode ter falhado) e recarrega
      document.querySelector('script[src*="turnstile"]')?.remove();
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
      s.async = true; s.defer = true;
      s.onerror = () => { setLoading(false); cb.current.onError?.(); };
      document.head.appendChild(s);
    }

    return () => {
      aliveRef.current = false;
      timersRef.current.forEach(clearTimeout); timersRef.current = [];
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, []);

  // Pedido de token novo: reset no widget existente
  useEffect(() => {
    if (resetSignal === 0) return;
    retriesRef.current = 0;
    setLoading(true);
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  return (
    <div className="flex flex-col items-center gap-2">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verificando segurança...</span>
        </div>
      )}
      <div ref={containerRef} className="cf-turnstile" />
    </div>
  );
}
