import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const STORAGE_KEY = 'viewAsClient';

export const ViewAsClientToggle = () => {
  const { isAdminOrSuperAdmin, loading } = useFeatureAccess();
  const [enabled, setEnabled] = useState<boolean>(() =>
    typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
  );

  useEffect(() => {
    // Listener para sincronizar entre abas
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEnabled(e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (loading || !isAdminOrSuperAdmin) return null;

  const toggle = () => {
    const next = !enabled;
    localStorage.setItem(STORAGE_KEY, String(next));
    setEnabled(next);
    // Recarrega para que todos os hooks/menus re-avaliem permissões
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

export default ViewAsClientToggle;
