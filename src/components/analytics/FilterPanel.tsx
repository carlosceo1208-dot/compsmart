import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalyticsFilters } from '@/contexts/AnalyticsFiltersContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompanyContext } from '@/contexts/CompanyContext';

export const FilterPanel = () => {
  const { filters, updateFilter, clearFilters } = useAnalyticsFilters();
  const { activeCompanyId } = useCompanyContext();
  const [nameSearch, setNameSearch] = useState(filters.name);

  // Debounce name search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilter('name', nameSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [nameSearch]);

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

  const { data: jobTitles } = useQuery({
    queryKey: ['job-titles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_titles')
        .select('id, title')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  const { data: grades } = useQuery({
    queryKey: ['grades-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('grade')
        .not('grade', 'is', null)
        .order('grade');
      if (error) throw error;
      const uniqueGrades = [...new Set(data.map(p => p.grade))];
      return uniqueGrades.filter(Boolean);
    },
  });

  const hasActiveFilters = 
    filters.name || 
    filters.unitIds.length > 0 || 
    filters.jobTitleIds.length > 0 || 
    filters.grades.length > 0 ||
    filters.status.length !== 1 ||
    !filters.status.includes('active');

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name-search">Nome do Funcionário</Label>
          <Input
            id="name-search"
            placeholder="Buscar por nome..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit-filter">Unidade</Label>
          <Select
            value={filters.unitIds[0] || 'all'}
            onValueChange={(value) => updateFilter('unitIds', value === 'all' ? [] : [value])}
          >
            <SelectTrigger id="unit-filter">
              <SelectValue placeholder="Todas as unidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {units?.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-filter">Cargo</Label>
          <Select
            value={filters.jobTitleIds[0] || 'all'}
            onValueChange={(value) => updateFilter('jobTitleIds', value === 'all' ? [] : [value])}
          >
            <SelectTrigger id="job-filter">
              <SelectValue placeholder="Todos os cargos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              {jobTitles?.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade-filter">Grade</Label>
          <Select
            value={filters.grades[0] || 'all'}
            onValueChange={(value) => updateFilter('grades', value === 'all' ? [] : [value])}
          >
            <SelectTrigger id="grade-filter">
              <SelectValue placeholder="Todas as grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as grades</SelectItem>
              {grades?.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={filters.status[0] || 'active'}
            onValueChange={(value) => updateFilter('status', [value])}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="on_leave">Em Licença</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.name && <Badge variant="secondary">Nome: {filters.name}</Badge>}
              {filters.unitIds.length > 0 && <Badge variant="secondary">{filters.unitIds.length} unidade(s)</Badge>}
              {filters.jobTitleIds.length > 0 && <Badge variant="secondary">{filters.jobTitleIds.length} cargo(s)</Badge>}
              {filters.grades.length > 0 && <Badge variant="secondary">{filters.grades.length} grade(s)</Badge>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
