import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

// Helper para normalizar strings removendo acentos e convertendo para minúsculas
const normalizeString = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

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
  const { activeCompanyId } = useCompanyContext();
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
    queryKey: ['employees-filtered', filters, page, pageSize, sortBy, sortOrder, activeCompanyId],
    queryFn: async () => {
      // Decidir se usaremos paginação no banco ou em memória
      const useDbPagination = !filters.search.trim();

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
          unit:organizational_structure!profiles_position_id_fkey(
            id, 
            name, 
            type,
            code
          )
        `,
          { count: 'exact' }
        )
        .eq('status', 'active');
      
      // Filtrar por empresa ativa (CORREÇÃO DE ISOLAMENTO)
      if (activeCompanyId) {
        query = query.eq('root_company_id', activeCompanyId);
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

      // Paginação no banco (apenas quando não há busca de texto)
      if (useDbPagination) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data: profiles, error, count } = await query;
      if (error) throw error;

      // Aplicar filtro de busca em memória (acento-insensitive)
      let filteredProfiles = profiles || [];
      
      if (filters.search.trim()) {
        // Dividir a busca em tokens (palavras separadas por espaço)
        const searchTerms = filters.search
          .trim()
          .split(/\s+/)
          .map(term => normalizeString(term))
          .filter(term => term.length > 0);

        filteredProfiles = filteredProfiles.filter((p: any) => {
          const name = normalizeString(p.full_name || '');
          const employeeNumber = (p.employee_number || '').toString().toLowerCase();
          
          // Concatenar nome + matrícula para busca unificada
          const searchableText = `${name} ${employeeNumber}`;

          // TODOS os termos devem estar presentes (AND)
          return searchTerms.every(term => 
            searchableText.includes(term)
          );
        });
      }

      // Buscar contagem de benefícios para cada funcionário
      const employeeIds = filteredProfiles.map((p) => p.id);
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

      // Filtrar por status de benefícios
      if (filters.has_benefits === 'with') {
        filteredProfiles = filteredProfiles.filter((p) => benefitCounts[p.id] > 0);
      } else if (filters.has_benefits === 'without') {
        filteredProfiles = filteredProfiles.filter((p) => !benefitCounts[p.id]);
      }

      // Paginação em memória (quando há busca de texto)
      let paginatedProfiles = filteredProfiles;
      let totalCount: number;

      if (useDbPagination) {
        totalCount = filters.has_benefits === 'all' ? count || 0 : filteredProfiles.length;
      } else {
        totalCount = filteredProfiles.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        paginatedProfiles = filteredProfiles.slice(start, end);
      }

      const employees = paginatedProfiles.map((profile) => ({
        ...profile,
        benefits_count: benefitCounts[profile.id] || 0,
      }));

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        employees,
        totalCount,
        totalPages,
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
