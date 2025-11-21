import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FilterState {
  search: string;
  unit_id: string[];
  unit_type: string;
  job_title: string;
  grade: string[];
  has_benefits: 'all' | 'with' | 'without';
}

const defaultFilters: FilterState = {
  search: '',
  unit_id: [],
  unit_type: 'all',
  job_title: '',
  grade: [],
  has_benefits: 'all',
};

export const useEmployeeFilters = () => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'full_name' | 'employee_number' | 'grade'>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Reset page quando filtros mudam
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['employees-filtered', filters, page, pageSize, sortBy, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(
          `
          id, 
          full_name, 
          employee_number, 
          job_title, 
          grade,
          salary,
          unit_id,
          unit:organizational_structure!profiles_unit_id_fkey(
            id, 
            name, 
            type,
            code
          )
        `,
          { count: 'exact' }
        )
        .eq('status', 'active');

      // Busca por texto (nome ou matrícula)
      if (filters.search.trim()) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,employee_number.ilike.%${filters.search}%`
        );
      }

      // Filtro por unidades específicas
      if (filters.unit_id.length > 0) {
        query = query.in('unit_id', filters.unit_id);
      }

      // Filtro por cargo
      if (filters.job_title) {
        query = query.eq('job_title', filters.job_title);
      }

      // Filtro por grades
      if (filters.grade.length > 0) {
        query = query.in('grade', filters.grade);
      }

      // Ordenação
      const orderColumn = sortBy === 'full_name' ? 'full_name' : sortBy;
      query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: profiles, error, count } = await query;
      if (error) throw error;

      // Buscar contagem de benefícios para cada funcionário
      const employeeIds = profiles?.map((p) => p.id) || [];
      let benefitCounts: Record<string, number> = {};

      if (employeeIds.length > 0) {
        const { data: benefitsData } = await supabase
          .from('employee_benefits')
          .select('employee_id')
          .in('employee_id', employeeIds)
          .eq('is_active', true);

        benefitCounts = (benefitsData || []).reduce((acc, b) => {
          acc[b.employee_id] = (acc[b.employee_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // Filtrar por status de benefícios se necessário
      let filteredProfiles = profiles || [];
      if (filters.has_benefits === 'with') {
        filteredProfiles = filteredProfiles.filter((p) => benefitCounts[p.id] > 0);
      } else if (filters.has_benefits === 'without') {
        filteredProfiles = filteredProfiles.filter((p) => !benefitCounts[p.id]);
      }

      const employees = filteredProfiles.map((profile) => ({
        ...profile,
        benefits_count: benefitCounts[profile.id] || 0,
      }));

      return {
        employees,
        totalCount: filters.has_benefits === 'all' ? count || 0 : employees.length,
        totalPages: Math.ceil((filters.has_benefits === 'all' ? count || 0 : employees.length) / pageSize),
      };
    },
  });

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const hasActiveFilters = () => {
    return (
      filters.search.trim() !== '' ||
      filters.unit_id.length > 0 ||
      filters.unit_type !== 'all' ||
      filters.job_title !== '' ||
      filters.grade.length > 0 ||
      filters.has_benefits !== 'all'
    );
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.unit_id.length > 0) count++;
    if (filters.unit_type !== 'all') count++;
    if (filters.job_title) count++;
    if (filters.grade.length > 0) count++;
    if (filters.has_benefits !== 'all') count++;
    return count;
  };

  return {
    filters,
    setFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    data,
    isLoading,
    refetch,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
    activeFiltersCount: activeFiltersCount(),
  };
};
