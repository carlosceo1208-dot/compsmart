import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface BudgetPlanningFilterPanelProps {
  fiscalYear: number;
  onFiscalYearChange: (year: number) => void;
  selectedUnitId: string | null;
  onUnitChange: (unitId: string | null) => void;
  isAdmin: boolean;
  isHR: boolean;
}

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

export const BudgetPlanningFilterPanel = ({
  fiscalYear,
  onFiscalYearChange,
  selectedUnitId,
  onUnitChange,
  isAdmin,
  isHR,
}: BudgetPlanningFilterPanelProps) => {
  // Buscar unidades organizacionais (apenas para Admin/HR)
  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ['organizational-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizational_structure')
        .select('id, code, description, type')
        .in('type', ['area', 'department', 'sector', 'project'])
        .order('code');

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin || isHR,
  });

  const showUnitSelector = isAdmin || isHR;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Ano Fiscal</Label>
          <Select
            value={fiscalYear.toString()}
            onValueChange={(value) => onFiscalYearChange(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showUnitSelector && (
          <div className="space-y-2">
            <Label>Unidade</Label>
            {unitsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedUnitId || 'all'}
                onValueChange={(value) => onUnitChange(value === 'all' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🏢 Empresa Toda</SelectItem>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.code} - {unit.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
