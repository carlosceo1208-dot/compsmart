import { Card, CardContent } from '@/components/ui/card';
import { Inbox, ShieldAlert } from 'lucide-react';

/** Estado vazio mostrado para clientes quando ainda não há ciclo coletado. */
export function Nr1EmptyState({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 flex flex-col items-center text-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">{titulo}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{descricao}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Banner amarelo exibido sobre painéis com dados ilustrativos (apenas Super Admin). */
export function Nr1SeedAlert() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
      <div>
        <strong>DADOS DEMONSTRATIVOS</strong> — este painel está exibindo números fictícios para validação interna.
        Para clientes, o painel só mostra resultados após a coleta real de respostas.
      </div>
    </div>
  );
}
