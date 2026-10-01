import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useNr1Diagnosticos } from '@/hooks/useNr1';
import { Nr1SeloSaude, Nr1SeloRodape } from '@/components/nr1/Nr1SeloSaude';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Plus } from 'lucide-react';

export default function Nr1Diagnosticos() {
  const { data, isLoading } = useNr1Diagnosticos();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Histórico de Diagnósticos</h2>
        <Button asChild className="nr1-bg-primary">
          <Link to="/nr1/diagnostico/novo"><Plus className="h-4 w-4 mr-1" />Novo</Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
            Nenhum diagnóstico ainda. Inicie o primeiro ciclo.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {data.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{d.ciclo_nome}</CardTitle>
                {(d.total_respondentes ?? 0) >= 5 && d.score_geral != null && (
                  <Nr1SeloSaude risco={d.score_geral} />
                )}
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span>Score: <strong className="text-foreground">{(d.total_respondentes ?? 0) < 5 || d.score_geral == null ? 'Dados insuficientes (menos de 5 respostas)' : d.score_geral.toFixed(1)}</strong></span>
                  <span>Respondentes: <strong className="text-foreground">{d.total_respondentes}</strong></span>
                  <span className="capitalize">Status: {d.status.replace('_', ' ')}</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/nr1/diagnostico/${d.id}`}><FileText className="h-4 w-4 mr-1" />Abrir</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          <Nr1SeloRodape />
        </div>
      )}
    </div>
  );
}
