import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PointsByGrade {
  grade: string;
  avgPoints: number;
  minPoints: number;
  maxPoints: number;
  count: number;
  hasInconsistency: boolean;
}

interface PointsByFamily {
  family: string;
  avgPoints: number;
  count: number;
}

interface PointsByDepartment {
  department: string;
  avgPoints: number;
  count: number;
}

interface PointsInconsistency {
  type: 'grade_variation' | 'missing_points' | 'outlier';
  description: string;
  severity: 'warning' | 'error';
  details: string;
}

export const usePointsDistribution = () => {
  // Buscar dados de pontos por grade
  const pointsByGrade = useQuery({
    queryKey: ["points-by-grade"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_titles")
        .select("grade, median_points, hay_total_points")
        .eq("is_active", true);

      if (error) throw error;

      // Agrupar por grade e calcular estatísticas
      const gradeMap = new Map<string, number[]>();
      
      data?.forEach((job) => {
        const points = job.hay_total_points || job.median_points || 0;
        if (points > 0) {
          const grade = job.grade || "Sem Grade";
          if (!gradeMap.has(grade)) {
            gradeMap.set(grade, []);
          }
          gradeMap.get(grade)!.push(points);
        }
      });

      const result: PointsByGrade[] = [];
      gradeMap.forEach((points, grade) => {
        const avgPoints = points.reduce((a, b) => a + b, 0) / points.length;
        const minPoints = Math.min(...points);
        const maxPoints = Math.max(...points);
        // Inconsistência se variação > 20%
        const variation = avgPoints > 0 ? ((maxPoints - minPoints) / avgPoints) * 100 : 0;
        
        result.push({
          grade,
          avgPoints: Math.round(avgPoints),
          minPoints,
          maxPoints,
          count: points.length,
          hasInconsistency: variation > 20 && points.length > 1,
        });
      });

      // Ordenar por grade
      return result.sort((a, b) => a.grade.localeCompare(b.grade));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Buscar dados de pontos por família de cargos
  const pointsByFamily = useQuery({
    queryKey: ["points-by-family"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_titles")
        .select("job_family, median_points, hay_total_points")
        .eq("is_active", true);

      if (error) throw error;

      const familyMap = new Map<string, number[]>();
      
      data?.forEach((job) => {
        const points = job.hay_total_points || job.median_points || 0;
        if (points > 0) {
          const family = job.job_family || "Sem Família";
          if (!familyMap.has(family)) {
            familyMap.set(family, []);
          }
          familyMap.get(family)!.push(points);
        }
      });

      const result: PointsByFamily[] = [];
      familyMap.forEach((points, family) => {
        result.push({
          family,
          avgPoints: Math.round(points.reduce((a, b) => a + b, 0) / points.length),
          count: points.length,
        });
      });

      return result.sort((a, b) => b.avgPoints - a.avgPoints);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Buscar dados de pontos por departamento (via profiles -> unit_id)
  const pointsByDepartment = useQuery({
    queryKey: ["points-by-department"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          unit_id,
          job_titles!inner (
            median_points,
            hay_total_points
          ),
          organizational_structure!profiles_unit_id_fkey (
            name
          )
        `)
        .eq("status", "active")
        .not("job_title_id", "is", null);

      if (error) throw error;

      const deptMap = new Map<string, { name: string; points: number[] }>();
      
      data?.forEach((profile: any) => {
        const points = profile.job_titles?.hay_total_points || profile.job_titles?.median_points || 0;
        const deptName = profile.organizational_structure?.name || "Sem Departamento";
        const deptId = profile.unit_id || "none";
        
        if (points > 0) {
          if (!deptMap.has(deptId)) {
            deptMap.set(deptId, { name: deptName, points: [] });
          }
          deptMap.get(deptId)!.points.push(points);
        }
      });

      const result: PointsByDepartment[] = [];
      deptMap.forEach((data) => {
        result.push({
          department: data.name,
          avgPoints: Math.round(data.points.reduce((a, b) => a + b, 0) / data.points.length),
          count: data.points.length,
        });
      });

      return result.sort((a, b) => b.avgPoints - a.avgPoints).slice(0, 10); // Top 10
    },
    staleTime: 5 * 60 * 1000,
  });

  // KPIs de cobertura de avaliação
  const pointsKPIs = useQuery({
    queryKey: ["points-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_titles")
        .select("median_points, hay_total_points")
        .eq("is_active", true);

      if (error) throw error;

      const total = data?.length || 0;
      const withPoints = data?.filter(
        (j) => (j.hay_total_points && j.hay_total_points > 0) || (j.median_points && j.median_points > 0)
      ).length || 0;
      const withoutPoints = total - withPoints;

      const allPoints = data
        ?.map((j) => j.hay_total_points || j.median_points || 0)
        .filter((p) => p > 0) || [];

      const avgPoints = allPoints.length > 0
        ? Math.round(allPoints.reduce((a, b) => a + b, 0) / allPoints.length)
        : 0;

      const coveragePercent = total > 0 ? Math.round((withPoints / total) * 100) : 0;

      return {
        totalJobs: total,
        jobsWithPoints: withPoints,
        jobsWithoutPoints: withoutPoints,
        avgPoints,
        coveragePercent,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Detectar inconsistências
  const inconsistencies = useQuery({
    queryKey: ["points-inconsistencies"],
    queryFn: async () => {
      const issues: PointsInconsistency[] = [];

      // Verificar grades com alta variação
      if (pointsByGrade.data) {
        pointsByGrade.data
          .filter((g) => g.hasInconsistency)
          .forEach((g) => {
            issues.push({
              type: 'grade_variation',
              description: `Grade ${g.grade} tem variação alta de pontos`,
              severity: 'warning',
              details: `Mín: ${g.minPoints} | Máx: ${g.maxPoints} | Média: ${g.avgPoints}`,
            });
          });
      }

      // Verificar cargos sem pontos
      if (pointsKPIs.data && pointsKPIs.data.jobsWithoutPoints > 0) {
        const percent = Math.round((pointsKPIs.data.jobsWithoutPoints / pointsKPIs.data.totalJobs) * 100);
        issues.push({
          type: 'missing_points',
          description: `${pointsKPIs.data.jobsWithoutPoints} cargos sem avaliação de pontos`,
          severity: percent > 20 ? 'error' : 'warning',
          details: `${percent}% dos cargos ativos não possuem pontos atribuídos`,
        });
      }

      return issues;
    },
    enabled: !!pointsByGrade.data && !!pointsKPIs.data,
    staleTime: 5 * 60 * 1000,
  });

  return {
    pointsByGrade,
    pointsByFamily,
    pointsByDepartment,
    pointsKPIs,
    inconsistencies,
    isLoading: pointsByGrade.isLoading || pointsByFamily.isLoading || 
               pointsByDepartment.isLoading || pointsKPIs.isLoading,
  };
};
