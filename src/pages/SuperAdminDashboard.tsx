import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useMFAStatus } from '@/hooks/useMFAStatus';
import { useSuperAdminDashboard } from '@/hooks/useSuperAdminDashboard';
import { SuperAdminKPICards } from '@/components/super-admin/SuperAdminKPICards';
import { CompanyDistributionCharts } from '@/components/super-admin/CompanyDistributionCharts';
import { ClientsTable } from '@/components/super-admin/ClientsTable';
import { TenureMetricsCard } from '@/components/super-admin/TenureMetricsCard';
import { FeedbackDashboard } from '@/components/super-admin/FeedbackDashboard';
import { TelemetryDashboard } from '@/components/super-admin/TelemetryDashboard';
import { StorageMigrationCard } from '@/components/super-admin/StorageMigrationCard';
import { LeadsShortcutCard } from '@/components/admin/LeadsShortcutCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();
  const { hasMFA, isLoading: mfaLoading } = useMFAStatus();
  const { data: metrics, isLoading: metricsLoading, error } = useSuperAdminDashboard();

  // Redirect if not super admin
  useEffect(() => {
    if (!roleLoading && !roleData?.isSuperAdmin) {
      navigate('/dashboard');
      return;
    }
    // ENFORCEMENT: super admin sem MFA → forçar enrollment
    if (!roleLoading && roleData?.isSuperAdmin && !mfaLoading && !hasMFA) {
      navigate('/auth/mfa-required');
    }
  }, [roleData, roleLoading, hasMFA, mfaLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!roleData?.isSuperAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold text-destructive">Erro ao Carregar</h1>
        <p className="text-muted-foreground">Não foi possível carregar os dados do painel.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Super Admin</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada da plataforma CompSmart</p>
        </div>
      </div>

      {/* Atalho de Leads */}
      <LeadsShortcutCard />

      {/* KPI Cards */}
      <SuperAdminKPICards metrics={metrics} isLoading={metricsLoading} />

      {/* Charts and Tenure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CompanyDistributionCharts metrics={metrics} isLoading={metricsLoading} />
        </div>
        <div>
          <TenureMetricsCard metrics={metrics} isLoading={metricsLoading} />
        </div>
      </div>

      {/* Clients Table */}
      <ClientsTable companies={metrics?.companies || []} isLoading={metricsLoading} />

      {/* Separator */}
      <Separator className="my-8" />

      {/* Telemetria Interna */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Telemetria da Plataforma</h2>
        <TelemetryDashboard />
      </div>

      {/* Separator */}
      <Separator className="my-8" />

      {/* Storage Migration (one-shot) */}
      <StorageMigrationCard />

      {/* Separator */}
      <Separator className="my-8" />

      {/* Feedback Dashboard */}
      <FeedbackDashboard />
    </div>
  );
};

export default SuperAdminDashboard;
