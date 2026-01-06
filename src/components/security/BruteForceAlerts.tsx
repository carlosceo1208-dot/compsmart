import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Globe, 
  Mail,
  Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSecurityAlerts, useAcknowledgeAlert, useResolveAlert } from '@/hooks/useSecurityAlerts';

const alertTypeLabels: Record<string, { label: string; icon: typeof AlertTriangle }> = {
  brute_force_ip: { label: 'Brute Force (IP)', icon: Globe },
  brute_force_email: { label: 'Brute Force (Email)', icon: Mail },
  mass_attack: { label: 'Ataque em Massa', icon: Shield },
  suspicious_pattern: { label: 'Padrão Suspeito', icon: AlertTriangle }
};

const severityColors: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20'
};

const statusColors: Record<string, string> = {
  new: 'bg-red-500/10 text-red-500',
  acknowledged: 'bg-yellow-500/10 text-yellow-500',
  resolved: 'bg-green-500/10 text-green-500'
};

export function BruteForceAlerts() {
  const { data: alerts, isLoading } = useSecurityAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeAlerts = alerts?.filter(a => a.status !== 'resolved') || [];
  const recentResolved = alerts?.filter(a => a.status === 'resolved').slice(0, 5) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertas de Segurança
        </CardTitle>
        {activeAlerts.length > 0 && (
          <Badge variant="destructive">{activeAlerts.length} ativos</Badge>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activeAlerts.length === 0 && recentResolved.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-2 text-green-500" />
              <p>Nenhum alerta de segurança</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Alerts */}
              {activeAlerts.map((alert) => {
                const alertType = alertTypeLabels[alert.alert_type] || { 
                  label: alert.alert_type, 
                  icon: AlertTriangle 
                };
                const Icon = alertType.icon;
                
                return (
                  <div 
                    key={alert.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{alertType.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={severityColors[alert.severity]}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge className={statusColors[alert.status]}>
                          {alert.status === 'new' ? 'Novo' : 'Reconhecido'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1 mb-3">
                      {alert.source_ip && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>IP: {alert.source_ip}</span>
                        </div>
                      )}
                      {alert.target_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>Email: {alert.target_email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(alert.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                      {alert.details && (
                        <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                          {(alert.details as Record<string, unknown>).failed_attempts && (
                            <span>Tentativas: {String((alert.details as Record<string, unknown>).failed_attempts)}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {alert.status === 'new' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => acknowledgeAlert.mutate(alert.id)}
                          disabled={acknowledgeAlert.isPending}
                        >
                          Reconhecer
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                        disabled={resolveAlert.isPending}
                      >
                        Resolver
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Recently Resolved */}
              {recentResolved.length > 0 && (
                <>
                  <div className="text-xs font-medium text-muted-foreground mt-6 mb-2">
                    Resolvidos Recentemente
                  </div>
                  {recentResolved.map((alert) => {
                    const alertType = alertTypeLabels[alert.alert_type] || { 
                      label: alert.alert_type, 
                      icon: AlertTriangle 
                    };
                    
                    return (
                      <div 
                        key={alert.id}
                        className="p-3 rounded-lg border border-green-500/20 bg-green-500/5 opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{alertType.label}</span>
                          <Badge className={statusColors.resolved}>Resolvido</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(alert.resolved_at || alert.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
