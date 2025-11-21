import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Building2, Users, Briefcase } from 'lucide-react';
import { FilterState } from '@/hooks/useEmployeeFilters';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface EmployeeBenefitAssignmentFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount: number;
  activeFiltersCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export const EmployeeBenefitAssignmentFilters = ({
  filters,
  onFiltersChange,
  resultCount,
  activeFiltersCount,
  hasActiveFilters,
  onClearFilters,
}: EmployeeBenefitAssignmentFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [isExpanded, setIsExpanded] = useState(true);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchTerm });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Buscar unidades organizacionais
  const { data: allUnits } = useQuery({
    queryKey: ['organizational-units-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizational_structure')
        .select('id, name, type, code, description')
        .in('type', ['area', 'department', 'sector', 'project'])
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar cargos únicos
  const { data: jobTitles } = useQuery({
    queryKey: ['unique-job-titles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('job_title')
        .eq('status', 'active')
        .not('job_title', 'is', null);
      
      if (error) throw error;
      const unique = [...new Set(data.map(p => p.job_title))].filter(Boolean);
      return unique.sort();
    },
  });

  // Buscar grades únicas
  const { data: grades } = useQuery({
    queryKey: ['unique-grades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('grade')
        .eq('status', 'active')
        .not('grade', 'is', null);
      
      if (error) throw error;
      const unique = [...new Set(data.map(p => p.grade))].filter(Boolean);
      return unique.sort();
    },
  });

  // Filtrar unidades por tipo
  const filteredUnits = allUnits?.filter(unit => 
    filters.unit_type === 'all' || unit.type === filters.unit_type
  );

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      all: 'Todas',
      area: 'Área',
      department: 'Departamento',
      sector: 'Setor',
      project: 'Projeto',
    };
    return labels[type] || type;
  };

  const toggleUnit = (unitId: string) => {
    const newUnits = filters.unit_id.includes(unitId)
      ? filters.unit_id.filter(id => id !== unitId)
      : [...filters.unit_id, unitId];
    onFiltersChange({ ...filters, unit_id: newUnits });
  };

  const toggleGrade = (grade: string) => {
    const newGrades = filters.grade.includes(grade)
      ? filters.grade.filter(g => g !== grade)
      : [...filters.grade, grade];
    onFiltersChange({ ...filters, grade: newGrades });
  };

  return (
    <Card className="mb-4">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filtros de Busca
              </CardTitle>
              <CardDescription>
                Use os filtros para encontrar funcionários rapidamente
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? 'Recolher' : 'Expandir'}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Busca por Nome/Matrícula */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="outline" onClick={onClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Grade de Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tipo de Unidade */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Tipo de Unidade
                </Label>
                <RadioGroup
                  value={filters.unit_type}
                  onValueChange={(value) => onFiltersChange({ ...filters, unit_type: value, unit_id: [] })}
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="type-all" />
                    <Label htmlFor="type-all" className="font-normal cursor-pointer">Todas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="area" id="type-area" />
                    <Label htmlFor="type-area" className="font-normal cursor-pointer">Área</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="department" id="type-department" />
                    <Label htmlFor="type-department" className="font-normal cursor-pointer">Departamento</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sector" id="type-sector" />
                    <Label htmlFor="type-sector" className="font-normal cursor-pointer">Setor</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Unidades Específicas */}
              <div className="space-y-2">
                <Label>Unidade(s)</Label>
                <ScrollArea className="h-32 border rounded-md p-2">
                  {filteredUnits?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma unidade encontrada</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredUnits?.map((unit) => (
                        <div key={unit.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`unit-${unit.id}`}
                            checked={filters.unit_id.includes(unit.id)}
                            onCheckedChange={() => toggleUnit(unit.id)}
                          />
                          <Label
                            htmlFor={`unit-${unit.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {unit.description || unit.name} ({unit.code})
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {filters.unit_id.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {filters.unit_id.length} unidade(s) selecionada(s)
                  </p>
                )}
              </div>

              {/* Grade */}
              <div className="space-y-2">
                <Label>Grade(s)</Label>
                <ScrollArea className="h-32 border rounded-md p-2">
                  {grades?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma grade encontrada</p>
                  ) : (
                    <div className="space-y-2">
                      {grades?.map((grade) => (
                        <div key={grade} className="flex items-center space-x-2">
                          <Checkbox
                            id={`grade-${grade}`}
                            checked={filters.grade.includes(grade)}
                            onCheckedChange={() => toggleGrade(grade)}
                          />
                          <Label
                            htmlFor={`grade-${grade}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Grade {grade}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {filters.grade.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {filters.grade.length} grade(s) selecionada(s)
                  </p>
                )}
              </div>

              {/* Cargo e Status */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Cargo
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={filters.job_title || undefined}
                      onValueChange={(value) => onFiltersChange({ ...filters, job_title: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Todos os cargos" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTitles?.map((title) => (
                          <SelectItem key={title} value={title}>
                            {title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filters.job_title && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onFiltersChange({ ...filters, job_title: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Status de Benefícios
                  </Label>
                  <Select
                    value={filters.has_benefits}
                    onValueChange={(value: 'all' | 'with' | 'without') =>
                      onFiltersChange({ ...filters, has_benefits: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="with">Com benefícios</SelectItem>
                      <SelectItem value="without">Sem benefícios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Indicador de Resultados */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                <strong>{resultCount}</strong> funcionário(s) encontrado(s)
              </span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="h-3 w-3" />
                  {activeFiltersCount} filtro(s) ativo(s)
                </Badge>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
