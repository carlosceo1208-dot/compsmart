import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

export default function PerformanceOneOnOnes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Reuniões 1:1
          </h1>
          <p className="text-sm text-muted-foreground">
            Agende e gerencie reuniões individuais com sua equipe
          </p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Agendar 1:1
        </Button>
      </div>

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-16 w-16 text-indigo-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma reunião agendada</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Agende reuniões 1:1 para acompanhar o desenvolvimento da equipe
          </p>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Agendar Primeira Reunião
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
