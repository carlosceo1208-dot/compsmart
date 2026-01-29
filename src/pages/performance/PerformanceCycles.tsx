import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  usePerformanceCycles,
  type PerformanceCycle,
  type CycleStatus,
} from "@/hooks/usePerformanceCycles";
import { CycleDialog } from "@/components/performance/CycleDialog";
import { CycleCard } from "@/components/performance/CycleCard";

export default function PerformanceCycles() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCycle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CycleStatus | "all">("all");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");

  const {
    cycles,
    isLoading,
    createCycle,
    updateCycle,
    deleteCycle,
  } = usePerformanceCycles({ includeInactive: true });

  // Get unique years from cycles
  const uniqueYears = Array.from(new Set(cycles.map((c) => c.fiscal_year))).sort(
    (a, b) => b - a
  );

  // Filter cycles
  const filteredCycles = cycles.filter((cycle) => {
    const matchesSearch =
      cycle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cycle.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cycle.status === statusFilter;
    const matchesYear = yearFilter === "all" || cycle.fiscal_year === yearFilter;
    return matchesSearch && matchesStatus && matchesYear;
  });

  const handleEdit = (cycle: PerformanceCycle) => {
    setSelectedCycle(cycle);
    setDialogOpen(true);
  };

  const handleDelete = (cycle: PerformanceCycle) => {
    setSelectedCycle(cycle);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedCycle) {
      await deleteCycle.mutateAsync(selectedCycle.id);
      setDeleteDialogOpen(false);
      setSelectedCycle(null);
    }
  };

  const handleSave = async (data: Parameters<typeof createCycle.mutateAsync>[0]) => {
    if (selectedCycle) {
      await updateCycle.mutateAsync({ id: selectedCycle.id, ...data });
    } else {
      await createCycle.mutateAsync(data);
    }
    setDialogOpen(false);
    setSelectedCycle(null);
  };

  const handleNewCycle = () => {
    setSelectedCycle(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Ciclos de Avaliação
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os ciclos de avaliação de desempenho
          </p>
        </div>
        <Button
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={handleNewCycle}
        >
          <Plus className="h-4 w-4" />
          Novo Ciclo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ciclos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as CycleStatus | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="goals">Definição de Metas</SelectItem>
            <SelectItem value="monitoring">Acompanhamento</SelectItem>
            <SelectItem value="insights">Análises</SelectItem>
            <SelectItem value="closing">Encerramento</SelectItem>
            <SelectItem value="closed">Encerrado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={String(yearFilter)}
          onValueChange={(v) =>
            setYearFilter(v === "all" ? "all" : parseInt(v, 10))
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ano Fiscal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Anos</SelectItem>
            {uniqueYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-indigo-200/50 dark:border-indigo-800/30">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-2 bg-muted rounded w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCycles.length === 0 ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-indigo-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {cycles.length === 0
                ? "Nenhum ciclo cadastrado"
                : "Nenhum ciclo encontrado"}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {cycles.length === 0
                ? "Crie seu primeiro ciclo de avaliação para começar"
                : "Tente ajustar os filtros de busca"}
            </p>
            {cycles.length === 0 && (
              <Button
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleNewCycle}
              >
                <Plus className="h-4 w-4" />
                Criar Primeiro Ciclo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCycles.map((cycle) => (
            <CycleCard
              key={cycle.id}
              cycle={cycle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Cycle Dialog */}
      <CycleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cycle={selectedCycle}
        onSave={handleSave}
        isPending={createCycle.isPending || updateCycle.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ciclo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o ciclo "{selectedCycle?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCycle.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
