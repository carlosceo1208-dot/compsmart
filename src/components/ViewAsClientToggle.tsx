import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'viewAsClient';

// Rotas públicas onde o toggle NUNCA deve aparecer,
// mesmo que exista uma sessão persistida no navegador.
const PUBLIC_PATH_PREFIXES = [
  '/',
  '/auth',
  '/forgot-password',
  '/reset-password',
  '/activate',
  '/onboarding',
  '/termos-de-uso',
  '/politica-de-privacidade',
  '/sobre-nos',
  '/glossario',
  '/changelog',
  '/checkout',
  '/nr1-lp',
  '/nr1-ads',
  '/cargos-e-salarios',
  '/clima-publico',
  '/clima-externo-publico',
  '/external-feedback',
  '/nr1/consentimento',
  '/nr1/responder',
  '/nr1/obrigado',
];

const isPublicRoute = (pathname: string) => {
  if (pathname === '/') return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => prefix !== '/' && (pathname === prefix || pathname.startsWith(prefix + '/'))
  );
};

export const ViewAsClientToggle = () => {
  const { isAdminOrSuperAdmin, loading } = useFeatureAccess();
  const location = useLocation();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState<boolean>(() =>
    typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
  );

  useEffect(() => {
    let mounted = true;
    // Verifica sessão real no servidor (getUser revalida o token)
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setHasSession(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setHasSession(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEnabled(e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Nunca renderiza em rotas públicas — evita expor o botão a visitantes
  // e evita confusão quando um admin já logado navega pela landing page.
  if (isPublicRoute(location.pathname)) return null;
  if (loading || hasSession !== true || !isAdminOrSuperAdmin) return null;

  const toggle = () => {
    const next = !enabled;
    localStorage.setItem(STORAGE_KEY, String(next));
    setEnabled(next);
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <Button
        onClick={toggle}
        size="sm"
        variant={enabled ? 'destructive' : 'secondary'}
        className="shadow-lg gap-2"
        title={enabled
          ? 'Você está vendo como cliente. Clique para voltar ao modo Super Admin.'
          : 'Simular visão de cliente (respeita cadeados e flags de add-ons).'}
      >
        {enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {enabled ? 'Modo Cliente ativo' : 'Ver como cliente'}
      </Button>
    </div>
  );
};

