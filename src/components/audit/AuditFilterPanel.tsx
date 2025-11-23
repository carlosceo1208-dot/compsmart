import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AuditFilters } from '@/hooks/useAuditLogs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AuditFilterPanelProps {
  filters: AuditFilters;
  onFiltersChange: (filters: AuditFilters) => void;
  onApply: () => void;
}

export const AuditFilterPanel = ({ filters, onFiltersChange, onApply }: AuditFilterPanelProps) => {
  const [showCustomRange, setShowCustomRange] = useState(false);

  const { data: users } = useQuery({
    queryKey: ['audit-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('status', 'active')
        .order('full_name');
      return data || [];
    }
  });

  const setPeriod = (type: string) => {
    const now = new Date();
    let start = now;
    let end = now;

    switch (type) {
      case '24h':
        start = subDays(now, 1);
        break;
      case '7d':
        start = subDays(now, 7);
        break;
      case '30d':
        start = subDays(now, 30);
        break;
      case 'month':
        start = startOfMonth(now);
        break;
      case 'custom':
        setShowCustomRange(true);
        return;
    }

    onFiltersChange({ ...filters, startDate: start, endDate: end });
  };

  const clearFilters = () => {
    onFiltersChange({
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
      companyId: undefined,
      userId: undefined,
      agentType: null,
      operationMode: undefined
    });
  };

  const hasActiveFilters = filters.userId || filters.agentType || filters.operationMode;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-auto text-xs text-muted-foreground">
              {[filters.userId, filters.agentType, filters.operationMode].filter(Boolean).length} ativos
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Período</Label>
          <Select onValueChange={setPeriod} defaultValue="30d">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="custom">Customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showCustomRange && (
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => date && onFiltersChange({ ...filters, startDate: date })}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Label>Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => date && onFiltersChange({ ...filters, endDate: date })}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="space-y-2">
          <Label>Usuário</Label>
          <Select 
            value={filters.userId || 'all'} 
            onValueChange={(value) => onFiltersChange({ ...filters, userId: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users?.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Agente</Label>
          <Select 
            value={filters.agentType || 'all'} 
            onValueChange={(value) => onFiltersChange({ ...filters, agentType: value === 'all' ? null : value as 'legal' | 'incentive' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="legal">Jurídico</SelectItem>
              <SelectItem value="incentive">Remuneração & Benefícios</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Modo de Operação</Label>
          <Select 
            value={filters.operationMode || 'all'} 
            onValueChange={(value) => onFiltersChange({ ...filters, operationMode: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="validar_politica">Validar Política</SelectItem>
              <SelectItem value="interpretar_lei">Interpretar Lei</SelectItem>
              <SelectItem value="gerar_politica">Gerar Política</SelectItem>
              <SelectItem value="comparar_mercado">Comparar Mercado</SelectItem>
              <SelectItem value="mix_total_rewards">Mix Total Rewards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={onApply} className="flex-1">
            <Filter className="w-4 h-4 mr-2" />
            Aplicar
          </Button>
          
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
