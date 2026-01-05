import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface Metrics {
  totalCompanies: number;
  totalEmployees: number;
  estimatedMRR: number;
  trialConversionRate: number;
}

interface SuperAdminKPICardsProps {
  metrics: Metrics | undefined;
  isLoading: boolean;
}

export const SuperAdminKPICards = ({ metrics, isLoading }: SuperAdminKPICardsProps) => {
  const kpis = [
    {
      title: 'Total de Empresas',
      value: metrics?.totalCompanies || 0,
      icon: Building2,
      color: 'from-blue-500 to-cyan-500',
      format: 'number',
    },
    {
      title: 'Total de Funcionários',
      value: metrics?.totalEmployees || 0,
      icon: Users,
      color: 'from-emerald-500 to-teal-500',
      format: 'number',
    },
    {
      title: 'MRR Estimado',
      value: metrics?.estimatedMRR || 0,
      icon: DollarSign,
      color: 'from-purple-500 to-indigo-500',
      format: 'currency',
    },
    {
      title: 'Taxa de Conversão',
      value: metrics?.trialConversionRate || 0,
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-500',
      format: 'percent',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="relative overflow-hidden border-0 shadow-md">
          <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-10`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.color}`}>
              <kpi.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {kpi.format === 'currency' && formatCurrency(kpi.value)}
              {kpi.format === 'percent' && `${kpi.value.toFixed(1)}%`}
              {kpi.format === 'number' && kpi.value.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
