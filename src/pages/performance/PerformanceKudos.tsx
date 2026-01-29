import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Plus } from "lucide-react";

export default function PerformanceKudos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Kudos
          </h1>
          <p className="text-sm text-muted-foreground">
            Reconheça e celebre as conquistas dos colegas
          </p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Enviar Kudos
        </Button>
      </div>

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Award className="h-16 w-16 text-indigo-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum kudos enviado</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Seja o primeiro a reconhecer um colega!
          </p>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Enviar Primeiro Kudos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
