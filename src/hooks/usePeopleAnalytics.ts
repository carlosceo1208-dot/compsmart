import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsFilters } from '@/contexts/AnalyticsFiltersContext';

export const usePeopleAnalytics = () => {
  const { filters } = useAnalyticsFilters();

  // Build dynamic filter conditions
  const buildFilterConditions = () => {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (filters.status.length > 0) {
      query = query.in('status', filters.status as any);
    }

    if (filters.name) {
      query = query.ilike('full_name', `%${filters.name}%`);
    }

    if (filters.unitIds.length > 0) {
      query = query.in('unit_id', filters.unitIds);
    }

    if (filters.jobTitleIds.length > 0) {
      query = query.in('job_title_id', filters.jobTitleIds);
    }

    if (filters.grades.length > 0) {
      query = query.in('grade', filters.grades);
    }

    return query;
  };

  // KPI: Average Salary
  const { data: avgSalary, isLoading: isLoadingAvg } = useQuery({
    queryKey: ['analytics-avg-salary', filters],
    queryFn: async () => {
      let query = buildFilterConditions();
      query = query.not('salary', 'is', null);
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) return 0;
      const sum = data.reduce((acc, p) => acc + (p.salary || 0), 0);
      return sum / data.length;
    },
    staleTime: 5 * 60 * 1000,
  });

  // KPI: Total Employees
  const { data: totalEmployees, isLoading: isLoadingTotal } = useQuery({
    queryKey: ['analytics-total-employees', filters],
    queryFn: async () => {
      const { count, error } = await buildFilterConditions();
      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  // KPI: Total Salary Mass
  const { data: totalSalary, isLoading: isLoadingMass } = useQuery({
    queryKey: ['analytics-total-salary', filters],
    queryFn: async () => {
      let query = buildFilterConditions();
      query = query.not('salary', 'is', null);
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) return 0;
      return data.reduce((acc, p) => acc + (p.salary || 0), 0);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Chart: Distribution by Unit
  const { data: distributionByUnit, isLoading: isLoadingByUnit } = useQuery({
    queryKey: ['analytics-by-unit', filters],
    queryFn: async () => {
      const { data: profiles, error } = await buildFilterConditions()
        .not('salary', 'is', null)
        .not('unit_id', 'is', null)
        .select('salary, unit_id');
      
      if (error) throw error;
      if (!profiles || profiles.length === 0) return [];

      const unitIds = [...new Set(profiles.map(p => p.unit_id).filter(Boolean))];
      
      const { data: units, error: unitsError } = await supabase
        .from('organizational_structure')
        .select('id, description')
        .in('id', unitIds);
      
      if (unitsError) throw unitsError;

      const grouped = profiles.reduce((acc, profile) => {
        const unitId = profile.unit_id!;
        if (!acc[unitId]) {
          acc[unitId] = {
            salaries: [],
            count: 0,
          };
        }
        acc[unitId].salaries.push(profile.salary);
        acc[unitId].count++;
        return acc;
      }, {} as Record<string, { salaries: number[]; count: number }>);

      return Object.entries(grouped)
        .map(([unitId, data]) => {
          const unit = units?.find(u => u.id === unitId);
          const totalSalary = data.salaries.reduce((sum, s) => sum + s, 0);
          const avgSalary = totalSalary / data.count;
          
          return {
            unidade: unit?.description || 'Não definido',
            total_funcionarios: data.count,
            media_salarial: Math.round(avgSalary),
            massa_salarial: Math.round(totalSalary),
          };
        })
        .sort((a, b) => b.massa_salarial - a.massa_salarial)
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Chart: Distribution by Grade
  const { data: distributionByGrade, isLoading: isLoadingByGrade } = useQuery({
    queryKey: ['analytics-by-grade', filters],
    queryFn: async () => {
      const { data, error } = await buildFilterConditions()
        .not('salary', 'is', null)
        .not('grade', 'is', null)
        .select('grade, salary');
      
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const grouped = data.reduce((acc, profile) => {
        const grade = profile.grade!;
        if (!acc[grade]) {
          acc[grade] = {
            salaries: [],
            count: 0,
          };
        }
        acc[grade].salaries.push(profile.salary);
        acc[grade].count++;
        return acc;
      }, {} as Record<string, { salaries: number[]; count: number }>);

      return Object.entries(grouped)
        .map(([grade, data]) => ({
          grade,
          total: data.count,
          media: Math.round(data.salaries.reduce((sum, s) => sum + s, 0) / data.count),
          minimo: Math.round(Math.min(...data.salaries)),
          maximo: Math.round(Math.max(...data.salaries)),
        }))
        .sort((a, b) => a.grade.localeCompare(b.grade));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Chart: Salary vs Range Comparison
  const { data: salaryVsRange, isLoading: isLoadingComparison } = useQuery({
    queryKey: ['analytics-salary-vs-range', filters],
    queryFn: async () => {
      const { data: profiles, error } = await buildFilterConditions()
        .not('salary', 'is', null)
        .not('grade', 'is', null)
        .select('grade, salary');
      
      if (error) throw error;
      if (!profiles || profiles.length === 0) return [];

      const grades = [...new Set(profiles.map(p => p.grade).filter(Boolean))];
      
      const { data: ranges, error: rangesError } = await supabase
        .from('salary_ranges')
        .select('grade, median_value, min_value, max_value')
        .in('grade', grades);
      
      if (rangesError) throw rangesError;

      const grouped = profiles.reduce((acc, profile) => {
        const grade = profile.grade!;
        if (!acc[grade]) {
          acc[grade] = [];
        }
        acc[grade].push(profile.salary);
        return acc;
      }, {} as Record<string, number[]>);

      return Object.entries(grouped)
        .map(([grade, salaries]) => {
          const range = ranges?.find(r => r.grade === grade);
          const avgSalary = salaries.reduce((sum, s) => sum + s, 0) / salaries.length;
          
          return {
            grade,
            salario_real: Math.round(avgSalary),
            faixa_mediana: range ? Math.round(range.median_value) : 0,
            faixa_minima: range ? Math.round(range.min_value) : 0,
            faixa_maxima: range ? Math.round(range.max_value) : 0,
          };
        })
        .sort((a, b) => a.grade.localeCompare(b.grade));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Top 10 Highest Salaries
  const { data: topSalaries, isLoading: isLoadingTop } = useQuery({
    queryKey: ['analytics-top-salaries', filters],
    queryFn: async () => {
      const { data, error } = await buildFilterConditions()
        .not('salary', 'is', null)
        .select('full_name, salary')
        .order('salary', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    kpis: {
      avgSalary,
      totalEmployees,
      totalSalary,
      isLoading: isLoadingAvg || isLoadingTotal || isLoadingMass,
    },
    charts: {
      distributionByUnit,
      distributionByGrade,
      salaryVsRange,
      isLoading: isLoadingByUnit || isLoadingByGrade || isLoadingComparison,
    },
    topSalaries: {
      data: topSalaries,
      isLoading: isLoadingTop,
    },
  };
};
