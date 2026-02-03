import { useState, useCallback } from "react";
import { EmployeeCard } from "@/components/performance/employees/EmployeeCard";
import { EmployeeDrawer } from "@/components/performance/employees/EmployeeDrawer";
import { EmployeeFilters } from "@/components/performance/employees/EmployeeFilters";
import { EmployeeKPIBar } from "@/components/performance/employees/EmployeeKPIBar";
import { usePerformanceEmployees, usePerformanceEmployeesKPIs, PerformanceEmployee } from "@/hooks/usePerformanceEmployees";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export default function PerformanceEmployees() {
  const [filters, setFilters] = useState({
    search: "",
    unitId: "",
    evaluationStatus: "",
  });
  const [selectedEmployee, setSelectedEmployee] = useState<PerformanceEmployee | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Aplicar filtros (remove 'all' values)
  const activeFilters = {
    search: filters.search,
    unitId: filters.unitId === "all" ? undefined : filters.unitId,
    evaluationStatus: filters.evaluationStatus === "all" ? undefined : filters.evaluationStatus,
  };

  const { data: employees = [], isLoading } = usePerformanceEmployees(activeFilters);
  const { kpis, isLoading: kpisLoading } = usePerformanceEmployeesKPIs();

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const handleEmployeeClick = (employee: PerformanceEmployee) => {
    setSelectedEmployee(employee);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          Colaboradores
        </h1>
        <p className="text-muted-foreground">
          Visualize e acompanhe o desempenho da sua equipe
        </p>
      </div>

      {/* KPIs */}
      <EmployeeKPIBar kpis={kpis} isLoading={kpisLoading} />

      {/* Filtros */}
      <EmployeeFilters onFiltersChange={handleFiltersChange} />

      {/* Lista de Colaboradores */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum colaborador encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Ajuste os filtros ou verifique suas permissões de acesso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onClick={() => handleEmployeeClick(employee)}
            />
          ))}
        </div>
      )}

      {/* Drawer de Detalhes */}
      <EmployeeDrawer
        employee={selectedEmployee}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
