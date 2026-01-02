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
    // Encontrar dados do ano
    const data = payload[0]?.payload;
    const fixo = data?.fixo || 0;
    const variavel = data?.variavel || 0;
    const beneficios = data?.beneficios || 0;
    const total = fixo + variavel + beneficios;
    const headcount = data?.headcount || 0;
    const status = data?.status || 'none';
    
    // Calcular percentuais
    const pctFixo = total > 0 ? ((fixo / total) * 100).toFixed(1) : '0.0';
    const pctVariavel = total > 0 ? ((variavel / total) * 100).toFixed(1) : '0.0';
    const pctBeneficios = total > 0 ? ((beneficios / total) * 100).toFixed(1) : '0.0';
    
    // Status labels
    const statusLabels: Record<string, string> = {
      approved: 'Aprovado',
      pending: 'Pendente',
      draft: 'Rascunho',
      rejected: 'Rejeitado',
      none: 'Sem dados',
    };
    
    return (
      <div className="bg-background border rounded-lg p-4 shadow-lg min-w-[240px]">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-base">Orçamento {label}</p>
          <Badge variant="outline" className="text-xs">
            {statusLabels[status]}
          </Badge>
        </div>
        
        <div className="space-y-2">
          {/* Salário Fixo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }} />
              <span className="text-sm">Salário Fixo</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">{formatCurrency(fixo)}</div>
              <div className="text-xs text-muted-foreground">{pctFixo}%</div>
            </div>
          </div>
          
          {/* Variável */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(24, 95%, 53%)' }} />
              <span className="text-sm">Variável</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">{formatCurrency(variavel)}</div>
              <div className="text-xs text-muted-foreground">{pctVariavel}%</div>
            </div>
          </div>
          
          {/* Benefícios */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }} />
              <span className="text-sm">Benefícios</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">{formatCurrency(beneficios)}</div>
              <div className="text-xs text-muted-foreground">{pctBeneficios}%</div>
            </div>
          </div>
        </div>
        
        {/* Separador e Total */}
        <div className="border-t mt-3 pt-3">
          <div className="flex justify-between items-center">
            <span className="font-bold">Total</span>
            <span className="font-bold text-base">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
            <span>Headcount</span>
            <span>{headcount} funcionários</span>
          </div>
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
      <div className={compact ? 'h-44' : 'h-60'}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
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
