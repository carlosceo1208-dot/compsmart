import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

interface UnitComparisonFilterProps {
  onFilterChange: (filters: {
    unitType: string | null;
    selectedUnitIds: string[];
    monthsBack: number;
  }) => void;
}

export const UnitComparisonFilter = ({ onFilterChange }: UnitComparisonFilterProps) => {
  const [unitType, setUnitType] = useState<string | null>(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [monthsBack, setMonthsBack] = useState(12);

  const { data: units } = useQuery({
    queryKey: ['organizational-units', unitType],
    queryFn: async () => {
      let query = supabase
        .from('organizational_structure')
        .select('id, name, type, code, description')
        .in('type', ['area', 'department', 'sector', 'project'])
        .order('description');

      if (unitType) {
        query = query.eq('type', unitType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    onFilterChange({ unitType, selectedUnitIds, monthsBack });
  }, [unitType, selectedUnitIds, monthsBack, onFilterChange]);

  const handleUnitToggle = (unitId: string) => {
    setSelectedUnitIds((prev) => {
      if (prev.includes(unitId)) {
        return prev.filter((id) => id !== unitId);
      } else if (prev.length < 5) {
        return [...prev, unitId];
      }
      return prev;
    });
  };

  const handleClearFilters = () => {
    setUnitType(null);
    setSelectedUnitIds([]);
    setMonthsBack(12);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      area: 'Área',
      department: 'Departamento',
      sector: 'Setor',
      project: 'Projeto',
    };
    return labels[type] || type;
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Filtros de Comparação</h3>
      </div>

      <div className="space-y-6">
        {/* Tipo de Unidade */}
        <div className="space-y-2">
          <Label>Tipo de Unidade</Label>
          <Select value={unitType || 'all'} onValueChange={(value) => setUnitType(value === 'all' ? null : value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="area">Áreas</SelectItem>
              <SelectItem value="department">Departamentos</SelectItem>
              <SelectItem value="sector">Setores</SelectItem>
              <SelectItem value="project">Projetos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Período */}
        <div className="space-y-2">
          <Label>Período</Label>
          <Select value={monthsBack.toString()} onValueChange={(value) => setMonthsBack(Number(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seleção de Unidades */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Selecionar Unidades {selectedUnitIds.length > 0 && `(${selectedUnitIds.length}/5)`}
            </Label>
            {selectedUnitIds.length >= 2 && (
              <Badge variant="outline" className="text-xs">
                Mínimo atingido
              </Badge>
            )}
          </div>

          {selectedUnitIds.length >= 5 && (
            <p className="text-sm text-muted-foreground">
              Máximo de 5 unidades selecionadas
            </p>
          )}

          <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
            {units?.map((unit) => (
              <div key={unit.id} className="flex items-center space-x-2">
                <Checkbox
                  id={unit.id}
                  checked={selectedUnitIds.includes(unit.id)}
                  onCheckedChange={() => handleUnitToggle(unit.id)}
                  disabled={!selectedUnitIds.includes(unit.id) && selectedUnitIds.length >= 5}
                />
                <label
                  htmlFor={unit.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {unit.description || unit.name}
                  {unit.code && (
                    <span className="text-muted-foreground ml-2">({unit.code})</span>
                  )}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getTypeLabel(unit.type)}
                  </Badge>
                </label>
              </div>
            ))}
          </div>

          {selectedUnitIds.length < 2 && selectedUnitIds.length > 0 && (
            <p className="text-sm text-amber-600">
              Selecione pelo menos 2 unidades para comparação
            </p>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>
      </div>
    </Card>
  );
};
