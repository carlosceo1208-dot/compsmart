import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Users, Calendar } from 'lucide-react';

interface Metrics {
  avgTenureMonths: number;
  totalEmployees: number;
  companies: { avg_tenure_months: number; name: string; fantasy_name: string | null }[];
}

interface TenureMetricsCardProps {
  metrics: Metrics | undefined;
  isLoading: boolean;
}

const formatTenure = (months: number): string => {
  if (months < 12) {
    return `${Math.round(months)} meses`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  if (remainingMonths === 0) {
    return `${years} ano${years > 1 ? 's' : ''}`;
  }
  return `${years}a ${remainingMonths}m`;
};

export const TenureMetricsCard = ({ metrics, isLoading }: TenureMetricsCardProps) => {
  if (isLoading) {
    return <Skeleton className="h-full min-h-[400px] rounded-xl" />;
  }

  const avgTenure = metrics?.avgTenureMonths || 0;
  const companies = metrics?.companies || [];
  
  // Find min and max tenure companies
  const sortedByTenure = [...companies].sort((a, b) => b.avg_tenure_months - a.avg_tenure_months);
  const topTenure = sortedByTenure.slice(0, 3).filter(c => c.avg_tenure_months > 0);
  const minTenure = sortedByTenure.filter(c => c.avg_tenure_months > 0).slice(-1)[0];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-500" />
          Tempo Médio de Empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main metric */}
        <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl">
          <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatTenure(avgTenure)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Média geral da plataforma</p>
        </div>

        {/* Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Empresas com maior retenção
          </h4>
          <div className="space-y-2">
            {topTenure.length > 0 ? (
              topTenure.map((company, index) => (
                <div 
                  key={company.name} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-5">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {company.fantasy_name || company.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatTenure(company.avg_tenure_months)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sem dados de tempo de empresa
              </p>
            )}
          </div>
        </div>

        {/* Min tenure info */}
        {minTenure && topTenure.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Menor média
              </span>
              <span className="font-medium">
                {formatTenure(minTenure.avg_tenure_months)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
