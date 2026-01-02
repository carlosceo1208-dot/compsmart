import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useBudgetHistoryYears } from '@/hooks/useBudgetHistoryYears';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';

interface BudgetMultiYearChartProps {
  compact?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-xs">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
        <div className="border-t mt-2 pt-2 flex justify-between gap-4 text-xs font-bold">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const BudgetMultiYearChart = ({ compact = false }: BudgetMultiYearChartProps) => {
  const { activeCompanyId } = useCompanyContext();
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  
  const { data: historyData, isLoading: isLoadingHistory } = useBudgetHistoryYears(selectedUnitId);

  // Buscar unidades organizacionais
  const { data: units, isLoading: isLoadingUnits } = useQuery({
    queryKey: ['organizational-units-filter', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      
      const { data, error } = await supabase
        .from('organizational_structure')
        .select('id, name, type')
        .eq('root_company_id', activeCompanyId)
        .in('type', ['branch', 'division', 'area', 'department'])
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeCompanyId,
  });

  const isLoading = isLoadingHistory || isLoadingUnits;

  // Preparar dados para o gráfico
  const chartData = historyData?.map(item => ({
    year: item.year.toString(),
    fixo: item.totalFixed,
    variavel: item.totalVariable,
    beneficios: item.totalBenefits,
    total: item.totalCost,
    headcount: item.headcount,
    status: item.status,
  })) || [];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      approved: { label: '✓', className: 'bg-green-600 text-white' },
      pending: { label: '⏳', className: 'bg-amber-500 text-white' },
      draft: { label: '📝', className: 'bg-muted text-muted-foreground' },
      rejected: { label: '✗', className: 'bg-red-500 text-white' },
      none: { label: '-', className: 'bg-muted/50 text-muted-foreground' },
    };
    return config[status] || config.none;
  };

  if (isLoading) {
    return <Skeleton className={compact ? 'h-48 w-full' : 'h-64 w-full'} />;
  }

  return (
    <div className="space-y-3">
      {/* Filtro de Unidade */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedUnitId || 'all'}
          onValueChange={(value) => setSelectedUnitId(value === 'all' ? null : value)}
        >
          <SelectTrigger className={compact ? 'h-7 text-xs w-full' : 'h-8 text-sm max-w-xs'}>
            <SelectValue placeholder="Todas as Unidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Unidades</SelectItem>
            {units?.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gráfico */}
      <div className={compact ? 'h-40' : 'h-56'}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: compact ? 10 : 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: compact ? 10 : 12 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              width={compact ? 40 : 50}
            />
            <Tooltip content={<CustomTooltip />} />
            {!compact && (
              <Legend 
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    fixo: 'Salário Fixo',
                    variavel: 'Variável',
                    beneficios: 'Benefícios',
                  };
                  return labels[value] || value;
                }}
              />
            )}
            <Bar 
              dataKey="fixo" 
              stackId="a" 
              fill="hsl(var(--primary))" 
              name="fixo"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="variavel" 
              stackId="a" 
              fill="hsl(24, 95%, 53%)" 
              name="variavel"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="beneficios" 
              stackId="a" 
              fill="hsl(142, 71%, 45%)" 
              name="beneficios"
              radius={[4, 4, 0, 0]}
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--foreground))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--background))', strokeWidth: 2 }}
              strokeDasharray="5 5"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Status dos Anos */}
      <div className="flex justify-around gap-1">
        {chartData.map((item) => {
          const badge = getStatusBadge(item.status);
          return (
            <div key={item.year} className="text-center">
              <div className="text-[10px] font-medium">{item.year}</div>
              <Badge className={`text-[9px] px-1 py-0 ${badge.className}`}>
                {badge.label}
              </Badge>
              <div className="text-[9px] text-muted-foreground">{item.headcount} func.</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
