import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCheck, Plus, Search, Loader2, MoreVertical, Pencil, Eye } from "lucide-react";
import { usePerformanceEvaluations, evaluationStatusLabels, evaluationStatusColors } from "@/hooks/usePerformanceEvaluations";
import { usePerformanceCycles } from "@/hooks/usePerformanceCycles";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PerformanceEvaluations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCycleId, setFilterCycleId] = useState<string | null>(null);

  const { cycles } = usePerformanceCycles();
  const { evaluations, isLoading } = usePerformanceEvaluations({ 
    cycleId: filterCycleId || undefined 
  });

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch = 
      (evaluation.employee?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = !filterStatus || evaluation.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = Object.entries(evaluationStatusLabels);
  const activeCycles = cycles.filter(c => c.status !== "closed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Avaliações
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as avaliações de desempenho dos colaboradores
          </p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" disabled>
          <Plus className="h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterCycleId || "all"} onValueChange={(v) => setFilterCycleId(v === "all" ? null : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por ciclo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ciclos</SelectItem>
            {cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {cycle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={filterStatus === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterStatus(null)}
          >
            Todos
          </Badge>
          {statusOptions.map(([key, label]) => (
            <Badge
              key={key}
              variant={filterStatus === key ? "default" : "outline"}
              className={`cursor-pointer ${filterStatus === key ? evaluationStatusColors[key] : ""}`}
              onClick={() => setFilterStatus(key)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-muted-foreground">Carregando avaliações...</p>
          </CardContent>
        </Card>
      ) : filteredEvaluations.length === 0 ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="h-16 w-16 text-indigo-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || filterStatus || filterCycleId 
                ? "Nenhuma avaliação encontrada" 
                : "Nenhuma avaliação cadastrada"}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {searchTerm || filterStatus || filterCycleId
                ? "Tente ajustar os filtros de busca"
                : "Crie um ciclo ativo e inicie as avaliações"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Avaliador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nota Final</TableHead>
                  <TableHead>Potencial</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">
                      {evaluation.employee?.full_name || "Colaborador"}
                    </TableCell>
                    <TableCell>
                      {evaluation.cycle?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {evaluation.evaluator?.full_name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {evaluation.evaluator_type === "self" ? "Auto" : 
                         evaluation.evaluator_type === "manager" ? "Gestor" :
                         evaluation.evaluator_type === "peer" ? "Par" :
                         evaluation.evaluator_type === "hr" ? "RH" : 
                         evaluation.evaluator_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={evaluationStatusColors[evaluation.status]}>
                        {evaluationStatusLabels[evaluation.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {evaluation.final_score !== null ? (
                        <span className="font-medium">{evaluation.final_score.toFixed(1)}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {evaluation.potential_score !== null ? (
                        <span className="font-medium">{evaluation.potential_score.toFixed(1)}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={evaluation.status === "approved"}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
