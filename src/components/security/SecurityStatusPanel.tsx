import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck } from 'lucide-react';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import {
  DEFAULT_ERROR_FINDINGS,
  useRegisterSecurityScanSnapshot,
  useSecurityStatus,
} from '@/hooks/useSecurityStatus';

export function SecurityStatusPanel() {
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();
  const { data: latest, isLoading } = useSecurityStatus();
  const registerMutation = useRegisterSecurityScanSnapshot();

  // Segurança extra: só renderiza para super_admin (além do guard da página)
  if (roleLoading) return null;
  if (!roleData?.isSuperAdmin) return null;

  const activeErrors = latest?.active_error_count ?? 0;
  const errorFindings = (latest?.ignored_findings?.length ? latest.ignored_findings : DEFAULT_ERROR_FINDINGS) ?? [];
  const ignored = errorFindings.filter(f => f.level === 'error' && f.ignore);
  const active = errorFindings.filter(f => f.level === 'error' && !f.ignore);
  const lastScanLabel = latest?.created_at
    ? new Date(latest.created_at).toLocaleString('pt-BR')
    : 'Sem registro';

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted">
              <ShieldCheck className="h-4 w-4 text-foreground" />
            </span>
            Security Status
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visível apenas para Super Admin. Último scan registrado: <span className="font-medium text-foreground">{lastScanLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={activeErrors === 0 ? 'secondary' : 'destructive'}>
            {activeErrors} erros ativos
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'Registrando…' : 'Registrar scan'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">Erros do scan (level: error)</div>
          <div className="text-xs text-muted-foreground">
            Exibe apenas itens <span className="font-mono">level=error</span>. Outros níveis são ignorados neste painel.
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : active.length === 0 && ignored.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum erro (level=error) registrado.</div>
        ) : (
          <div className="space-y-4">
            {active.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Erros ativos</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Internal ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Nível</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {active.map((f, idx) => (
                      <TableRow key={(f.internal_id || f.id || 'active') + '-' + idx}>
                        <TableCell className="font-mono text-xs">{f.internal_id || f.id || '-'}</TableCell>
                        <TableCell className="text-sm">{f.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{f.level || 'error'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {ignored.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Erros ignorados (com justificativa)</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Internal ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Justificativa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ignored.map((f, idx) => (
                      <TableRow key={(f.internal_id || f.id || 'ignored') + '-' + idx}>
                        <TableCell className="font-mono text-xs">{f.internal_id || f.id || '-'}</TableCell>
                        <TableCell className="text-sm">{f.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{f.level || 'error'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.ignore_reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
