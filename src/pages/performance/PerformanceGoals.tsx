import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Plus } from "lucide-react";

export default function PerformanceGoals() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Metas Cascateadas
          </h1>
          <p className="text-sm text-muted-foreground">
            Defina metas da empresa até o nível individual
          </p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Target className="h-16 w-16 text-indigo-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma meta cadastrada</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Comece definindo as metas da empresa
          </p>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Criar Meta da Empresa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
