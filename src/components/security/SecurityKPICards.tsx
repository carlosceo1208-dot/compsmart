import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Globe, 
  Building2, 
  AlertTriangle 
} from 'lucide-react';
import type { SecurityMetrics } from '@/hooks/useSecurityDashboard';

interface SecurityKPICardsProps {
  metrics?: SecurityMetrics;
  isLoading: boolean;
}

export function SecurityKPICards({ metrics, isLoading }: SecurityKPICardsProps) {
  const cards = [
    {
      title: 'Total de Tentativas (24h)',
      value: metrics?.totalAttempts24h || 0,
      icon: Shield,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Taxa de Sucesso',
      value: `${metrics?.successRate || 0}%`,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Falhas',
      value: metrics?.failedAttempts || 0,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'IPs Únicos',
      value: metrics?.uniqueIPs || 0,
      icon: Globe,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Empresas Ativas',
      value: metrics?.activeCompanies || 0,
      icon: Building2,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10'
    },
    {
      title: 'Alertas Ativos',
      value: metrics?.activeAlerts || 0,
      icon: AlertTriangle,
      color: metrics?.activeAlerts && metrics.activeAlerts > 0 ? 'text-orange-500' : 'text-muted-foreground',
      bgColor: metrics?.activeAlerts && metrics.activeAlerts > 0 ? 'bg-orange-500/10' : 'bg-muted/50'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <span className="text-xs text-muted-foreground truncate">{card.title}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
