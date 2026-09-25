import { useEffect, useRef, useCallback, useState } from "react";
import { Loader2 } from "lucide-react";

const TURNSTILE_SITE_KEY = "0x4AAAAAACKfutEiGcNZieDn";
const MAX_RETRIES = 3;

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  onLoading?: (isLoading: boolean) => void;
  silentFallback?: boolean;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback': () => void;
        'expired-callback': () => void;
        size?: 'invisible' | 'normal' | 'compact';
        theme?: 'light' | 'dark' | 'auto';
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export function TurnstileWidget({ onVerify, onError, onExpire, onLoading, silentFallback = true }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const updateLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    onLoading?.(loading);
  }, [onLoading]);

  const handleVerify = useCallback((token: string) => {
    updateLoading(false);
    setRetryCount(0);
    onVerify(token);
  }, [onVerify, updateLoading]);

  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRIES - 1) {
      setRetryCount(prev => prev + 1);
      // Retry after a short delay
      setTimeout(() => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      }, 1000);
    } else {
      // Silent fallback - just stop trying without showing error
      updateLoading(false);
      if (!silentFallback) {
        onError?.();
      }
    }
  }, [retryCount, onError, updateLoading, silentFallback]);

  const handleExpire = useCallback(() => {
    console.log("Turnstile token expired");
    updateLoading(false);
    onExpire?.();
  }, [onExpire, updateLoading]);

  // Load Turnstile script
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      if (window.turnstile) {
        setScriptLoaded(true);
      } else {
        window.onTurnstileLoad = () => setScriptLoaded(true);
      }
      return;
    }

    window.onTurnstileLoad = () => setScriptLoaded(true);

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  // Render widget when script is loaded
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;
    
    // Remove existing widget if any
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }

    updateLoading(true);

    // Render normal (compact) widget - more reliable than invisible
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: handleVerify,
      'error-callback': handleError,
      'expired-callback': handleExpire,
      size: 'normal',
      theme: 'auto',
    });
  }, [scriptLoaded, handleVerify, handleError, handleExpire, updateLoading]);

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

function useTurnstileReset() {
  return useCallback((widgetId?: string) => {
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
    }
  }, []);
}
