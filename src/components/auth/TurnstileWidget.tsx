import { useEffect, useRef, useCallback, useState } from "react";

const TURNSTILE_SITE_KEY = "0x4AAAAAACKfutEiGcNZieDn";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
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

export function TurnstileWidget({ onVerify, onError, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const handleVerify = useCallback((token: string) => {
    onVerify(token);
  }, [onVerify]);

  const handleError = useCallback(() => {
    console.error("Turnstile error occurred");
    onError?.();
  }, [onError]);

  const handleExpire = useCallback(() => {
    console.log("Turnstile token expired");
    onExpire?.();
  }, [onExpire]);

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

    // Render invisible widget
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: handleVerify,
      'error-callback': handleError,
      'expired-callback': handleExpire,
      size: 'invisible',
      theme: 'auto',
    });
  }, [scriptLoaded, handleVerify, handleError, handleExpire]);

  return <div ref={containerRef} className="cf-turnstile" />;
}

export function useTurnstileReset() {
  return useCallback((widgetId?: string) => {
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
    }
  }, []);
}
