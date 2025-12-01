import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';

interface BudgetUnitBreakdown {
  unitName: string;
  unitId: string;
  totalSalary: number;
  existingEmployees: number;
  plannedHires: number;
  salaryChanges: number;
  projectionCount: number;
}

interface BudgetUnitBreakdownCardProps {
  fiscalYear: number;
}

export const BudgetUnitBreakdownCard = ({ fiscalYear }: BudgetUnitBreakdownCardProps) => {
  const { data: breakdown, isLoading } = useQuery({
    queryKey: ['budget-unit-breakdown', fiscalYear],
    queryFn: async () => {
      // Buscar todas as projeções agrupadas por unidade
      const { data: projections, error } = await supabase
        .from('budget_employee_projections')
        .select(`
          projected_unit_id,
          projected_fixed_salary,
          is_planned_hire,
          change_type,
          employee_id,
          planned_employee_name,
          projected_unit:organizational_structure(description)
        `)
        .eq('fiscal_year', fiscalYear)
        .eq('is_active', true);

      if (error) throw error;

      // Agrupar por unidade usando Sets para contar pessoas únicas
      const unitMap = new Map<string, {
        unitName: string;
        totalSalary: number;
        projectionCount: number;
        uniqueExistingEmployees: Set<string>;
        uniqueHires: Set<string>;
        uniqueChanges: Set<string>;
      }>();
      
      projections?.forEach((p: any) => {
        const unitId = p.projected_unit_id || 'sem-unidade';
        const unitName = p.projected_unit?.description || 'Sem Unidade';
        
        if (!unitMap.has(unitId)) {
          unitMap.set(unitId, {
            unitName,
            totalSalary: 0,
            projectionCount: 0,
            uniqueExistingEmployees: new Set<string>(),
            uniqueHires: new Set<string>(),
            uniqueChanges: new Set<string>(),
          });
        }
        
        const unit = unitMap.get(unitId)!;
        unit.totalSalary += p.projected_fixed_salary || 0;
        unit.projectionCount++;
        
        // Contar funcionários existentes únicos (não contratações planejadas)
        if (p.is_planned_hire && p.planned_employee_name) {
          unit.uniqueHires.add(p.planned_employee_name);
        } else if (p.employee_id) {
          unit.uniqueExistingEmployees.add(p.employee_id);
        }
        
        // Contar alterações salariais únicas
        if (p.change_type && p.employee_id) {
          unit.uniqueChanges.add(p.employee_id);
        }
      });

      // Converter Sets para números finais
      return Array.from(unitMap.entries())
        .map(([unitId, unit]) => ({
          unitId,
          unitName: unit.unitName,
          totalSalary: unit.totalSalary,
          projectionCount: unit.projectionCount,
          existingEmployees: unit.uniqueExistingEmployees.size,
          plannedHires: unit.uniqueHires.size,
          salaryChanges: unit.uniqueChanges.size,
        }))
        .sort((a, b) => b.totalSalary - a.totalSalary);
    },
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totals = breakdown?.reduce(
    (acc, unit) => ({
      existingEmployees: acc.existingEmployees + unit.existingEmployees,
      plannedHires: acc.plannedHires + unit.plannedHires,
      salaryChanges: acc.salaryChanges + unit.salaryChanges,
      totalSalary: acc.totalSalary + unit.totalSalary,
    }),
    { existingEmployees: 0, plannedHires: 0, salaryChanges: 0, totalSalary: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Breakdown por Unidade Organizacional
        </CardTitle>
        <CardDescription>
          Totais de salários, contratações e alterações por área
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Func. Existentes</TableHead>
              <TableHead className="text-right">Contratações</TableHead>
              <TableHead className="text-right">Alt. Salariais</TableHead>
              <TableHead className="text-right">Total Salários</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown?.map((unit) => (
              <TableRow key={unit.unitId}>
                <TableCell className="font-medium">{unit.unitName}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="border-purple-200 text-purple-700">
                    {unit.existingEmployees}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    {unit.plannedHires}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {unit.salaryChanges}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-primary">
                  {formatCurrency(unit.totalSalary)}
                </TableCell>
              </TableRow>
            ))}
            {/* Linha de Total */}
            <TableRow className="bg-muted/50 font-bold border-t-2">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="border-purple-300 text-purple-800">
                  {totals?.existingEmployees || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                  {totals?.plannedHires || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="border-blue-300 text-blue-800">
                  {totals?.salaryChanges || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-primary">
                {formatCurrency(totals?.totalSalary || 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
