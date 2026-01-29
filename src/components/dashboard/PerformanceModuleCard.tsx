import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowRight, Target, ClipboardCheck, LayoutGrid, Award } from "lucide-react";

export function PerformanceModuleCard() {
  return (
    <Card className="overflow-hidden border-2 border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-indigo-950/30 dark:via-background dark:to-indigo-950/30 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-100">
                Avaliação de Desempenho
              </h3>
              <p className="text-sm text-muted-foreground">
                Gestão de Performance Estratégica
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
            Novo
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/50 dark:bg-background/50">
            <Target className="h-4 w-4 text-indigo-600 mb-1" />
            <span className="text-xs text-muted-foreground">Metas</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/50 dark:bg-background/50">
            <ClipboardCheck className="h-4 w-4 text-indigo-600 mb-1" />
            <span className="text-xs text-muted-foreground">Avaliações</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/50 dark:bg-background/50">
            <LayoutGrid className="h-4 w-4 text-indigo-600 mb-1" />
            <span className="text-xs text-muted-foreground">9Box</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/50 dark:bg-background/50">
            <Award className="h-4 w-4 text-indigo-600 mb-1" />
            <span className="text-xs text-muted-foreground">Kudos</span>
          </div>
        </div>

        <Link to="/performance">
          <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            Acessar Módulo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
