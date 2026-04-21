import { useEffect } from 'react';
import { EquityDashboardCard } from '@/components/equity/EquityDashboardCard';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export default function Equity() {
  const { data: role, isLoading } = useCurrentUserRole();
  const isAuthorized = role?.isAdmin || role?.isHR || role?.isSuperAdmin;

  useEffect(() => {
    document.title = 'Equidade Salarial | CompSmart';
  }, []);

  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Equidade Salarial</h1>
          <p className="text-muted-foreground">
            Justiça interna, gap por gênero e dispersão salarial — base para decisões orientadas por dados.
          </p>
        </header>

        {!isLoading && !isAuthorized ? (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acesso restrito</AlertTitle>
            <AlertDescription>
              Esta página é exclusiva para Administradores e RH.
            </AlertDescription>
          </Alert>
        ) : (
          <EquityDashboardCard />
        )}
      </div>
    </>
  );
}
