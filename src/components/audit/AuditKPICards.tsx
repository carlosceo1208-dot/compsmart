import { MessageSquare, Zap, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/formatters';
import { AuditKPIs } from '@/hooks/useAuditKPIs';

interface AuditKPICardsProps {
  kpis: AuditKPIs | undefined;
  isLoading: boolean;
}

export const AuditKPICards = ({ kpis, isLoading }: AuditKPICardsProps) => {
  const cards = [
    {
      title: 'Total de Consultas',
      value: kpis?.total_queries || 0,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: kpis ? `${kpis.legal_queries} Legal | ${kpis.incentive_queries} R&B` : 'Carregando...'
    },
    {
      title: 'Tokens Consumidos',
      value: formatNumber(kpis?.total_tokens || 0),
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'IA utilizada'
    },
    {
      title: 'Tempo Médio',
      value: `${Math.round(kpis?.avg_response_time || 0)}ms`,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Resposta do agente'
    },
    {
      title: 'Usuários Únicos',
      value: kpis?.unique_users || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Utilizaram os agentes'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">{card.value}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
