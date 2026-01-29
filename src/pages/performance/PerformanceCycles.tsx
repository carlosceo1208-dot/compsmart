import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

export default function PerformanceCycles() {
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
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Novo Ciclo
        </Button>
      </div>

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calendar className="h-16 w-16 text-indigo-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum ciclo cadastrado</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Crie seu primeiro ciclo de avaliação para começar
          </p>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Criar Primeiro Ciclo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
