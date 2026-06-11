import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConversationLog } from '@/hooks/useAuditLogs';
import { ConversationDetailDialog } from './ConversationDetailDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AuditLogsTableProps {
  logs: ConversationLog[] | undefined;
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const AuditLogsTable = ({ logs, isLoading, page, totalPages, onPageChange }: AuditLogsTableProps) => {
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);

  const getAgentBadge = (type: 'legal' | 'incentive') => {
    return type === 'legal' ? (
      <Badge variant="default">Jurídico</Badge>
    ) : (
      <Badge variant="secondary">R&B</Badge>
    );
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>Modo</TableHead>
                <TableHead>Pergunta</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Tempo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado com os filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.user_name}</p>
                        <p className="text-xs text-muted-foreground">{log.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getAgentBadge(log.agent_type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.operation_mode || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{truncateText(log.question)}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <p>{log.question}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {log.tokens_used}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {log.response_time_ms}ms
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => page > 1 && onPageChange(page - 1)}
                  className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              <PaginationItem>
                <span className="px-4 py-2 text-sm">
                  Página {page} de {totalPages}
                </span>
              </PaginationItem>
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => page < totalPages && onPageChange(page + 1)}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <ConversationDetailDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </>
  );
};
