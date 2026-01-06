import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Download, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthAttemptLogs, type AuthAttemptLog } from '@/hooks/useSecurityDashboard';
import { useQueryClient } from '@tanstack/react-query';

export function SecurityLogsTable() {
  const [emailFilter, setEmailFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const queryClient = useQueryClient();
  
  const filters = {
    email: emailFilter || undefined,
    ip: ipFilter || undefined,
    success: statusFilter === 'all' ? undefined : statusFilter === 'success'
  };
  
  const { data: logs, isLoading, isFetching } = useAuthAttemptLogs(filters);

  const handleExport = () => {
    if (!logs) return;
    
    const headers = ['Data/Hora', 'Email', 'IP', 'Status', 'Motivo', 'User Agent'];
    const rows = logs.map(log => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
      log.email,
      log.ip_address || '-',
      log.success ? 'Sucesso' : 'Falha',
      log.failure_reason || '-',
      log.user_agent || '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `security-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    link.click();
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['auth-attempt-logs'] });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Logs de Autenticação</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por email..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por IP..."
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="failed">Falha</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Data/Hora</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs && logs.length > 0 ? (
                  logs.map((log: AuthAttemptLog) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.email}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            <XCircle className="h-3 w-3 mr-1" />
                            Falha
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.failure_reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum log encontrado com os filtros aplicados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
        
        {logs && (
          <div className="text-xs text-muted-foreground mt-2">
            Exibindo {logs.length} registros (máximo 500)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
