import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImportHistory, useImportRunDetail } from '@/hooks/useEmployeeImport';
import { fieldLabel } from '@/lib/employeeImport/validateRows';

const STRATEGY_LABELS: Record<string, string> = {
  update: 'Atualizar existentes',
  ignore: 'Ignorar existentes',
  only_new: 'Somente novos',
};

const ERROR_TYPE_LABELS: Record<string, string> = {
  validacao: 'Validação',
  conflito: 'Conflito',
  gravacao: 'Gravação',
  ignorado: 'Ignorado',
  aviso: 'Aviso',
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function ImportHistory() {
  const { data: runs, isLoading } = useImportHistory();
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const detail = useImportRunDetail(selectedRun);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando histórico...
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Nenhuma importação registrada até agora.
      </p>
    );
  }

  if (selectedRun) {
    const run = runs.find((item) => item.id === selectedRun);
    const mappedFields = Object.entries(run?.mapping ?? {}).filter(([, column]) => !!column);

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedRun(null)}>
          Voltar ao histórico
        </Button>

        <div className="rounded-2xl border p-4">
          <p className="font-medium">{run?.file_name}</p>
          <p className="text-sm text-muted-foreground">
            {run ? formatDateTime(run.created_at) : ''} ·{' '}
            {STRATEGY_LABELS[run?.duplicate_strategy ?? ''] ?? run?.duplicate_strategy}
            {run?.source_system ? ` · ${run.source_system}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">Linhas: {run?.total_rows ?? 0}</Badge>
            <Badge variant="outline">Importadas: {run?.imported_count ?? 0}</Badge>
            <Badge variant="outline">Atualizadas: {run?.updated_count ?? 0}</Badge>
            <Badge variant="outline">Ignoradas: {run?.ignored_count ?? 0}</Badge>
            <Badge variant="outline">Com erro: {run?.error_count ?? 0}</Badge>
          </div>
        </div>

        <Tabs defaultValue="erros">
          <TabsList>
            <TabsTrigger value="erros">Log de erros</TabsTrigger>
            <TabsTrigger value="alteracoes">Alterações</TabsTrigger>
            <TabsTrigger value="mapeamento">Mapeamento</TabsTrigger>
          </TabsList>

          <TabsContent value="erros" className="pt-3">
            {detail.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : detail.data?.errors.length ? (
              <div className="max-h-72 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.data.errors.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell className="font-mono text-xs">{error.row_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ERROR_TYPE_LABELS[error.error_type] ?? error.error_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{error.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground">Nenhum erro registrado.</p>
            )}
          </TabsContent>

          <TabsContent value="alteracoes" className="pt-3">
            {detail.data?.changes.length ? (
              <div className="max-h-72 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Campo</TableHead>
                      <TableHead>Antes</TableHead>
                      <TableHead>Depois</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.data.changes.map((change) => (
                      <TableRow key={change.id}>
                        <TableCell className="font-mono text-xs">
                          {change.row_number ?? '—'}
                        </TableCell>
                        <TableCell>{fieldLabel(change.field)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {change.old_value ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm">{change.new_value ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground">
                Nenhuma alteração de dados nesta importação.
              </p>
            )}
          </TabsContent>

          <TabsContent value="mapeamento" className="pt-3">
            <div className="max-h-72 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campo da plataforma</TableHead>
                    <TableHead>Coluna da planilha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedFields.map(([field, column]) => (
                    <TableRow key={field}>
                      <TableCell>{fieldLabel(field)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{column}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arquivo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Linhas</TableHead>
            <TableHead>Importadas</TableHead>
            <TableHead>Atualizadas</TableHead>
            <TableHead>Com erro</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell className="max-w-[200px] truncate">{run.file_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(run.created_at)}
              </TableCell>
              <TableCell>{run.total_rows}</TableCell>
              <TableCell>{run.imported_count}</TableCell>
              <TableCell>{run.updated_count}</TableCell>
              <TableCell>{run.error_count}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => setSelectedRun(run.id)}>
                  Detalhes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
