import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  Calculator, 
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BookOpen
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ENPSInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ENPSInfoDialog = ({ open, onOpenChange }: ENPSInfoDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-indigo-600" />
            eNPS - Employee Net Promoter Score
          </DialogTitle>
          <DialogDescription>
            Métrica estratégica de engajamento e lealdade dos colaboradores
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* O que é */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                O que é o eNPS?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O eNPS baseia-se em uma única pergunta fundamental:
              </p>
              <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 italic">
                  "Em uma escala de 0 a 10, o quanto você recomendaria esta empresa como um bom lugar para se trabalhar?"
                </p>
              </div>
            </section>

            {/* Classificação */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                Classificação dos Colaboradores
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">Promotores (Notas 9 e 10)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Colaboradores altamente engajados, que "vestem a camisa" e impulsionam a cultura da empresa.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center flex-shrink-0">
                    <Minus className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-400">Neutros (Notas 7 e 8)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Satisfeitos, mas não entusiasmados. Vulneráveis a ofertas de mercado.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">Detratores (Notas 0 a 6)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Colaboradores insatisfeitos que podem impactar negativamente o clima organizacional.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Cálculo */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-indigo-500" />
                Como Calcular?
              </h3>
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-lg font-bold text-center text-indigo-700 dark:text-indigo-300 mb-3">
                  eNPS = % Promotores − % Detratores
                </p>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-2">Exemplo prático:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• 100 colaboradores responderam</li>
                    <li>• 50 são Promotores (50%)</li>
                    <li>• 30 são Neutros (30%)</li>
                    <li>• 20 são Detratores (20%)</li>
                    <li className="font-bold text-indigo-600 dark:text-indigo-400">• eNPS = 50% - 20% = +30</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Régua de Benchmarking */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-500" />
                Régua de Benchmarking
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-bold text-red-700 dark:text-red-400">-100 a 0</span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400">Zona Crítica</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    <span className="font-bold text-amber-700 dark:text-amber-400">1 a 40</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Zona de Aperfeiçoamento</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">41 a 70</span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Zona de Qualidade</p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    <span className="font-bold text-indigo-700 dark:text-indigo-400">71 a 100</span>
                  </div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">Zona de Excelência</p>
                </div>
              </div>
            </section>

            {/* Dicas */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Recomendações
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-lg">🔄</span>
                  <span><strong>Frequência:</strong> Realize a pesquisa trimestralmente para captar variações rápidas de clima.</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-lg">🔒</span>
                  <span><strong>Anonimato:</strong> Garanta que as respostas sejam anônimas para obter máxima sinceridade.</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-lg">🎯</span>
                  <span><strong>Ação:</strong> O pior erro é medir e não agir. Compartilhe resultados e mostre o plano de ação.</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-lg">🔗</span>
                  <span><strong>Cruze com 9Box:</strong> Identifique se seus talentos de alto desempenho são promotores ou detratores.</span>
                </li>
              </ul>
            </section>

            {/* Link para Glossário */}
            <div className="pt-4 border-t">
              <Link to="/performance/glossary">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <BookOpen className="h-4 w-4" />
                  Ver no Glossário Completo
                </Button>
              </Link>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
