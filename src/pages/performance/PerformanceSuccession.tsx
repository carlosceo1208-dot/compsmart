import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Plus } from "lucide-react";

export default function PerformanceSuccession() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Plano de Sucessão
          </h1>
          <p className="text-sm text-muted-foreground">
            Identifique e prepare sucessores para posições-chave
          </p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Mapear Sucessão
        </Button>
      </div>

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <UserPlus className="h-16 w-16 text-indigo-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum mapeamento cadastrado</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Identifique posições-chave e potenciais sucessores
          </p>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Iniciar Mapeamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
