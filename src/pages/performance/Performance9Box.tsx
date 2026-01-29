import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";

const boxLabels = [
  ["Enigma", "Forte Desempenho", "Alto Potencial"],
  ["Questionável", "Mantenedor", "Promessa"],
  ["Insuficiente", "Eficaz", "Profissional"],
];

const boxColors = [
  ["bg-amber-100 border-amber-300", "bg-blue-100 border-blue-300", "bg-emerald-100 border-emerald-300"],
  ["bg-orange-100 border-orange-300", "bg-gray-100 border-gray-300", "bg-cyan-100 border-cyan-300"],
  ["bg-red-100 border-red-300", "bg-slate-100 border-slate-300", "bg-indigo-100 border-indigo-300"],
];

export default function Performance9Box() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
          Matriz 9Box
        </h1>
        <p className="text-sm text-muted-foreground">
          Análise de Desempenho x Potencial
        </p>
      </div>

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <LayoutGrid className="h-5 w-5" />
            Matriz de Talentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex">
            {/* Y-axis label */}
            <div className="flex flex-col justify-center items-center w-8 mr-2">
              <span className="text-xs font-medium text-muted-foreground writing-mode-vertical transform -rotate-180" style={{ writingMode: 'vertical-rl' }}>
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
                    {row.map((label, colIndex) => (
                      <div
                        key={colIndex}
                        className={`flex-1 h-24 rounded-lg border-2 ${boxColors[rowIndex][colIndex]} flex flex-col items-center justify-center p-2 cursor-pointer hover:shadow-md transition-shadow`}
                      >
                        <span className="text-xs font-medium text-center">{label}</span>
                        <span className="text-lg font-bold mt-1">0</span>
                      </div>
                    ))}
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

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="text-sm">
            Complete as avaliações para visualizar a distribuição dos colaboradores na matriz 9Box
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
