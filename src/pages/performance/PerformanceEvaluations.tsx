import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Plus } from "lucide-react";

export default function PerformanceEvaluations() {
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
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ClipboardCheck className="h-16 w-16 text-indigo-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma avaliação encontrada</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Crie um ciclo ativo e inicie as avaliações
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
