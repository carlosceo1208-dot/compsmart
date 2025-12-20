import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { useBudgetFilters } from '@/contexts/BudgetFiltersContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export const BudgetFilterPanel = () => {
  const { filters, updateFilter, clearFilters } = useBudgetFilters();
  const { activeCompanyId } = useCompanyContext();

  const { data: units } = useQuery({
    queryKey: ['organizational-units', activeCompanyId],
    queryFn: async () => {
      let query = supabase
        .from('organizational_structure')
        .select('id, description, type, root_company_id')
        .in('type', ['area', 'department', 'sector', 'project']);
      
      // Filtrar por empresa ativa (CORREÇÃO DE ISOLAMENTO)
      if (activeCompanyId) {
        query = query.or(`root_company_id.eq.${activeCompanyId},id.eq.${activeCompanyId}`);
      }
      
      const { data, error } = await query.order('description');
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Ano Fiscal</label>
          <Select
            value={filters.fiscalYear.toString()}
            onValueChange={(value) => updateFilter('fiscalYear', parseInt(value))}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Mês</label>
          <Select
            value={filters.month?.toString() || 'all'}
            onValueChange={(value) => updateFilter('month', value === 'all' ? null : parseInt(value))}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos os Meses</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Unidade Organizacional</label>
          <Select
            value={filters.unitId || 'company'}
            onValueChange={(value) => updateFilter('unitId', value === 'company' ? null : value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="company">Total da Empresa</SelectItem>
              {units?.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      </CardContent>
    </Card>
  );
};
