import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Eye } from 'lucide-react';
import { AlertHistory, useAcknowledgeAlert, useResolveAlert } from '@/hooks/useAlertHistory';
import { alertTypeLabels } from '@/hooks/useAlertConfigs';
import { format } from 'date-fns';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AlertHistoryTableProps {
  alerts: AlertHistory[];
}

export const AlertHistoryTable = ({ alerts }: AlertHistoryTableProps) => {
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const [selectedAlert, setSelectedAlert] = useState<AlertHistory | null>(null);

  const severityColors = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500'
  };

  const statusColors = {
    active: 'bg-red-500',
    acknowledged: 'bg-yellow-500',
    resolved: 'bg-green-500'
  };

  const statusLabels = {
    active: 'Ativo',
    acknowledged: 'Reconhecido',
    resolved: 'Resolvido'
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Severidade</TableHead>
              <TableHead>Métrica</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum alerta encontrado
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => {
                const alertInfo = alertTypeLabels[alert.alert_type as keyof typeof alertTypeLabels];
                return (
                  <TableRow key={alert.id}>
                    <TableCell>
                      {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{alertInfo?.icon}</span>
                        <span className="text-sm">{alertInfo?.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{alert.title}</TableCell>
                    <TableCell>
                      <Badge className={severityColors[alert.severity]}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {alert.metric_value.toFixed(0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[alert.status]}>
                        {statusLabels[alert.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {alert.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => acknowledgeAlert.mutate(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveAlert.mutate(alert.id)}
                          >
                            Resolver
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAlert?.title}</DialogTitle>
            <DialogDescription>
              Detectado em {selectedAlert && format(new Date(selectedAlert.created_at), 'dd/MM/yyyy HH:mm')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="whitespace-pre-line text-sm">
              {selectedAlert?.description}
            </div>
            {selectedAlert?.context && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-2">Detalhes Técnicos</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(selectedAlert.context, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
