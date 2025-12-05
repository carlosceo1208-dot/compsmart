import { Users, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatYears, formatPercentageSafe } from '@/lib/formatters';
import { differenceInYears, differenceInMonths, subYears } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export const HRMetricsCard = () => {
  const { data: hrMetrics, isLoading } = useQuery({
    queryKey: ['kpi-hr-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('birth_date, hire_date, status, updated_at');
      
      if (error) throw error;
      if (!data) return null;

      const activeEmployees = data.filter(p => p.status === 'active');
      const now = new Date();
      
      // 1. Tempo médio de empresa (em anos)
      const tenures = activeEmployees
        .filter(p => p.hire_date)
        .map(p => differenceInMonths(now, new Date(p.hire_date)) / 12);
      const avgTenure = tenures.length > 0 
        ? tenures.reduce((a, b) => a + b, 0) / tenures.length 
        : 0;
      
      // 2. Distribuição por faixa etária
      const ageDistribution = {
        '18-30': 0,
        '31-40': 0,
        '41-50': 0,
        '51+': 0
      };
      
      activeEmployees.forEach(p => {
        if (!p.birth_date) return;
        const age = differenceInYears(now, new Date(p.birth_date));
        if (age <= 30) ageDistribution['18-30']++;
        else if (age <= 40) ageDistribution['31-40']++;
        else if (age <= 50) ageDistribution['41-50']++;
        else ageDistribution['51+']++;
      });
      
      const totalWithAge = Object.values(ageDistribution).reduce((a, b) => a + b, 0);
      const agePercentages = totalWithAge > 0 ? {
        '18-30': (ageDistribution['18-30'] / totalWithAge) * 100,
        '31-40': (ageDistribution['31-40'] / totalWithAge) * 100,
        '41-50': (ageDistribution['41-50'] / totalWithAge) * 100,
        '51+': (ageDistribution['51+'] / totalWithAge) * 100
      } : { '18-30': 0, '31-40': 0, '41-50': 0, '51+': 0 };
      
      // 3. Rotatividade (últimos 12 meses)
      const oneYearAgo = subYears(now, 1);
      const terminations = data.filter(p => 
        p.status !== 'active' && 
        p.updated_at &&
        new Date(p.updated_at) > oneYearAgo
      ).length;
      
      const avgHeadcount = activeEmployees.length;
      const turnoverRate = avgHeadcount > 0 
        ? (terminations / avgHeadcount) * 100 
        : 0;
      
      return { 
        avgTenure, 
        agePercentages, 
        turnoverRate, 
        terminations,
        totalActive: activeEmployees.length 
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const getTurnoverVariant = (rate: number) => {
    if (rate > 20) return 'text-red-600';
    if (rate > 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Métricas de RH
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="space-y-4">
            {/* Rotatividade */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Rotatividade (12m)
              </div>
              <div className="flex items-baseline gap-2">
                {hrMetrics?.terminations === 0 ? (
                  <span className="text-sm text-muted-foreground">Sem desligamentos</span>
                ) : (
                  <>
                    <span className={`text-2xl font-bold ${getTurnoverVariant(hrMetrics?.turnoverRate || 0)}`}>
                      {formatPercentageSafe(hrMetrics?.turnoverRate || 0, 1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({hrMetrics?.terminations} desligamento{hrMetrics?.terminations !== 1 ? 's' : ''})
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Tempo Médio de Empresa */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Tempo Médio de Empresa
              </div>
              <div className="text-2xl font-bold">
                {formatYears(hrMetrics?.avgTenure || 0)}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Distribuição por Faixa Etária - Gráfico de Pizza */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium">
                Distribuição por Idade
              </div>
              {(() => {
                const ageChartData = hrMetrics?.agePercentages ? [
                  { name: '18-30', value: hrMetrics.agePercentages['18-30'], color: 'hsl(var(--chart-1))' },
                  { name: '31-40', value: hrMetrics.agePercentages['31-40'], color: 'hsl(var(--chart-2))' },
                  { name: '41-50', value: hrMetrics.agePercentages['41-50'], color: 'hsl(var(--chart-3))' },
                  { name: '51+', value: hrMetrics.agePercentages['51+'], color: 'hsl(var(--chart-4))' },
                ].filter(item => item.value > 0) : [];

                return ageChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={ageChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={45}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ value }) => `${value.toFixed(0)}%`}
                        labelLine={false}
                      >
                        {ageChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom"
                        height={36}
                        iconSize={8}
                        formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Sem dados de idade
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
