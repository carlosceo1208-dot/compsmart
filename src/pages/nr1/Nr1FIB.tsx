import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, Upload } from 'lucide-react';
import { GerarPgrButton } from '@/components/nr1/GerarPgrButton';
import { Nr1MatrizRisco } from '@/components/nr1/Nr1MatrizRisco';

export default function Nr1FIB() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Matriz de Risco NR-1</h2>
        <p className="text-sm text-muted-foreground">
          Matriz 5×5 de Severidade × Probabilidade alimentada pelo questionário de 40 perguntas (COPSOQ-III adaptado).
        </p>
      </div>

      <Card className="nr1-bg-soft border-[hsl(var(--nr1-primary)/0.2)]">
        <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold">Ações de Conformidade NR-1</p>
            <p className="text-xs text-muted-foreground">Gere o PGR e gerencie o Plano de Ação a partir do diagnóstico atual.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm">
              <Link to="/nr1/planos-acao"><ListChecks className="h-4 w-4 mr-1" /> Plano de Ação</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/nr1/importacoes"><Upload className="h-4 w-4 mr-1" /> Importações</Link>
            </Button>
            <GerarPgrButton size="sm" variant="default" className="nr1-bg-primary" />
          </div>
        </CardContent>
      </Card>

      <Nr1MatrizRisco />
    </div>
  );
}
