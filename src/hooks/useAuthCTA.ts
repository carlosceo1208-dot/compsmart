import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Retorna o destino correto para CTAs públicos:
 * - Usuário autenticado → /dashboard
 * - Visitante → /auth
 */
export function useAuthCTA() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setIsLoggedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setIsLoggedIn(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    isLoggedIn,
    ctaTo: isLoggedIn ? "/dashboard" : "/auth",
    ctaLabel: isLoggedIn ? "Ir para o app" : "Começar agora",
  };
}
