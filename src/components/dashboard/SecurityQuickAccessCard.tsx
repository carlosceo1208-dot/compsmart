import { Shield, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSecurityDashboard } from '@/hooks/useSecurityDashboard';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { Skeleton } from '@/components/ui/skeleton';

export const SecurityQuickAccessCard = () => {
  const navigate = useNavigate();
  const { data: metrics, isLoading: metricsLoading } = useSecurityDashboard();
  const { data: activeAlerts, isLoading: alertsLoading } = useSecurityAlerts('active');

  const isLoading = metricsLoading || alertsLoading;
  const alertCount = activeAlerts?.length || 0;
  const hasActiveAlerts = alertCount > 0;

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border/50 ${hasActiveAlerts ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className={`h-4 w-4 ${hasActiveAlerts ? 'text-destructive' : 'text-primary'}`} />
          Monitoramento de Segurança
          {hasActiveAlerts && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertTriangle className="h-3 w-3" />
              {alertCount} alerta{alertCount > 1 ? 's' : ''} ativo{alertCount > 1 ? 's' : ''}
            </span>
          )}
          {!hasActiveAlerts && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle className="h-3 w-3" />
              Tudo seguro
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 p-2">
            <div className="text-lg font-semibold">{metrics?.totalAttempts24h || 0}</div>
            <div className="text-[10px] text-muted-foreground">Tentativas 24h</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <div className={`text-lg font-semibold ${(metrics?.successRate || 0) < 80 ? 'text-amber-600' : 'text-green-600'}`}>
              {(metrics?.successRate || 0).toFixed(0)}%
            </div>
            <div className="text-[10px] text-muted-foreground">Taxa Sucesso</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <div className="text-lg font-semibold">{metrics?.uniqueIPs || 0}</div>
            <div className="text-[10px] text-muted-foreground">IPs Únicos</div>
          </div>
        </div>
        
        <Button 
          variant={hasActiveAlerts ? "destructive" : "outline"} 
          className="w-full" 
          size="sm"
          onClick={() => navigate('/security-dashboard')}
        >
          Ver Dashboard Completo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
