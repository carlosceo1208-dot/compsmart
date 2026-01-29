import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, Loader2, Users } from "lucide-react";
import { usePerformanceEvaluations } from "@/hooks/usePerformanceEvaluations";
import { usePerformanceCycles } from "@/hooks/usePerformanceCycles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const boxLabels = [
  ["Enigma", "Forte Desempenho", "Alto Potencial"],
  ["Questionável", "Mantenedor", "Promessa"],
  ["Insuficiente", "Eficaz", "Profissional"],
];

const boxColors = [
  ["bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700", "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700", "bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700"],
  ["bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700", "bg-gray-100 border-gray-300 dark:bg-gray-800/50 dark:border-gray-700", "bg-cyan-100 border-cyan-300 dark:bg-cyan-900/30 dark:border-cyan-700"],
  ["bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700", "bg-slate-100 border-slate-300 dark:bg-slate-800/50 dark:border-slate-700", "bg-indigo-100 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-700"],
];

interface EmployeeInBox {
  id: string;
  name: string;
  avatar_url?: string | null;
  final_score: number;
  potential_score: number;
}

interface BoxData {
  count: number;
  employees: EmployeeInBox[];
}

export default function Performance9Box() {
  const [filterCycleId, setFilterCycleId] = useState<string | null>(null);
  const [selectedBox, setSelectedBox] = useState<{ row: number; col: number } | null>(null);

  const { cycles, isLoading: loadingCycles } = usePerformanceCycles();
  const { get9BoxData, isLoading: loadingEvaluations } = usePerformanceEvaluations({ 
    cycleId: filterCycleId || undefined 
  });

  const isLoading = loadingCycles || loadingEvaluations;

  // Calculate 9Box matrix data
  const nineBoxData = useMemo(() => {
    const rawData = get9BoxData();
    
    // Initialize empty matrix
    const matrix: BoxData[][] = Array(3).fill(null).map(() => 
      Array(3).fill(null).map(() => ({ count: 0, employees: [] }))
    );

    // Classify each employee into a box
    rawData.forEach(emp => {
      const perfScore = emp.performanceScore;
      const potScore = emp.potentialScore;

      // Performance: Low (0-3.33), Medium (3.33-6.66), High (6.66-10)
      // Potential: Low (0-3.33), Medium (3.33-6.66), High (6.66-10)
      const perfLevel = perfScore < 3.33 ? 0 : perfScore < 6.66 ? 1 : 2;
      const potLevel = potScore < 3.33 ? 2 : potScore < 6.66 ? 1 : 0;

      matrix[potLevel][perfLevel].count++;
      matrix[potLevel][perfLevel].employees.push({
        id: emp.id,
        name: emp.employeeName,
        avatar_url: emp.avatarUrl,
        final_score: perfScore,
        potential_score: potScore,
      });
    });

    return matrix;
  }, [get9BoxData]);

  const handleBoxClick = (row: number, col: number) => {
    if (nineBoxData[row][col].count > 0) {
      setSelectedBox({ row, col });
    }
  };

  const totalEmployees = nineBoxData.flat().reduce((sum, box) => sum + box.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Matriz 9Box
          </h1>
          <p className="text-sm text-muted-foreground">
            Análise de Desempenho x Potencial
          </p>
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
      </div>

      {isLoading ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-muted-foreground">Carregando matriz...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-indigo-200/50 dark:border-indigo-800/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                  <LayoutGrid className="h-5 w-5" />
                  Matriz de Talentos
                </CardTitle>
                <Badge variant="secondary">
                  {totalEmployees} colaborador{totalEmployees !== 1 ? "es" : ""} avaliado{totalEmployees !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex">
                {/* Y-axis label */}
                <div className="flex flex-col justify-center items-center w-8 mr-2">
                  <span 
                    className="text-xs font-medium text-muted-foreground transform -rotate-180" 
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    POTENCIAL
                  </span>
                </div>
                
                <div className="flex-1">
                  {/* Y-axis markers */}
                  <div className="flex mb-2">
                    <div className="w-8" />
                    <div className="flex-1 flex justify-around text-xs text-muted-foreground">
                      <span>Baixo</span>
                      <span>Médio</span>
                      <span>Alto</span>
                    </div>
                  </div>
                  
                  {/* Grid */}
                  <div className="grid grid-rows-3 gap-2">
                    {boxLabels.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex gap-2">
                        <div className="w-8 flex items-center justify-center text-xs text-muted-foreground">
                          {rowIndex === 0 ? "Alto" : rowIndex === 1 ? "Médio" : "Baixo"}
                        </div>
                        {row.map((label, colIndex) => {
                          const boxData = nineBoxData[rowIndex][colIndex];
                          return (
                            <div
                              key={colIndex}
                              className={`flex-1 h-24 rounded-lg border-2 ${boxColors[rowIndex][colIndex]} flex flex-col items-center justify-center p-2 cursor-pointer hover:shadow-md transition-all ${boxData.count > 0 ? "hover:scale-[1.02]" : "opacity-70"}`}
                              onClick={() => handleBoxClick(rowIndex, colIndex)}
                            >
                              <span className="text-xs font-medium text-center">{label}</span>
                              <span className="text-2xl font-bold mt-1">{boxData.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  
                  {/* X-axis label */}
                  <div className="flex justify-center mt-4">
                    <span className="text-xs font-medium text-muted-foreground">DESEMPENHO</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {totalEmployees === 0 && (
            <Card className="border-indigo-200/50 dark:border-indigo-800/30">
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-sm">
                  Complete as avaliações para visualizar a distribuição dos colaboradores na matriz 9Box
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog de detalhes */}
      <Dialog open={selectedBox !== null} onOpenChange={() => setSelectedBox(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              {selectedBox && boxLabels[selectedBox.row][selectedBox.col]}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedBox && nineBoxData[selectedBox.row][selectedBox.col].employees.map((employee) => (
              <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={employee.avatar_url || undefined} />
                  <AvatarFallback>
                    {employee.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{employee.name}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Desempenho: {employee.final_score.toFixed(1)}</span>
                    <span>Potencial: {employee.potential_score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}

            {selectedBox && nineBoxData[selectedBox.row][selectedBox.col].employees.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum colaborador neste quadrante
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
