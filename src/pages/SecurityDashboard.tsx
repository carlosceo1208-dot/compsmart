import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useSecurityDashboard } from '@/hooks/useSecurityDashboard';
import { SecurityKPICards } from '@/components/security/SecurityKPICards';
import { SecurityTimeline } from '@/components/security/SecurityTimeline';
import { BruteForceAlerts } from '@/components/security/BruteForceAlerts';
import { SecurityLogsTable } from '@/components/security/SecurityLogsTable';
import { SecurityStatusPanel } from '@/components/security/SecurityStatusPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, AlertTriangle } from 'lucide-react';

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();
  const { data: metrics, isLoading: metricsLoading } = useSecurityDashboard();

  // Redirect if not super admin
  useEffect(() => {
    if (!roleLoading && !roleData?.isSuperAdmin) {
      navigate('/dashboard');
    }
  }, [roleData, roleLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
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
        <p className="text-muted-foreground">Este painel é exclusivo para Super Administradores.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 text-white">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoramento de Segurança</h1>
          <p className="text-sm text-muted-foreground">
            Detecção de brute-force e monitoramento de tentativas de login em tempo real
          </p>
        </div>
      </div>

      {/* Security Status (Super Admin only) */}
      <SecurityStatusPanel />

      {/* KPI Cards */}
      <SecurityKPICards metrics={metrics} isLoading={metricsLoading} />

      {/* Charts */}
      <SecurityTimeline metrics={metrics} isLoading={metricsLoading} />

      {/* Alerts and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BruteForceAlerts />
        </div>
        <div className="lg:col-span-2">
          <SecurityLogsTable />
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
