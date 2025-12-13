import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, History } from 'lucide-react';
import { AlertConfigCard } from '@/components/alerts/AlertConfigCard';
import { AlertHistoryTable } from '@/components/alerts/AlertHistoryTable';
import { useAlertConfigs } from '@/hooks/useAlertConfigs';
import { useAlertHistory } from '@/hooks/useAlertHistory';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AlertSettings = () => {
  const { data: configs, isLoading: configsLoading } = useAlertConfigs();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  
  const { data: alerts, isLoading: alertsLoading } = useAlertHistory({
    status: statusFilter === 'all' ? undefined : statusFilter,
    severity: severityFilter === 'all' ? undefined : severityFilter,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações de Alertas</h1>
        <p className="text-muted-foreground mt-2">
          Configure alertas automáticos para monitorar o uso dos Agentes Smart
        </p>
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations" className="gap-2">
            <Bell className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Alertas</CardTitle>
              <CardDescription>
                Configure os thresholds e destinatários para cada tipo de alerta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando configurações...
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {configs
                    ?.filter(config => config.alert_type !== 'token_overconsumption')
                    .map((config) => (
                      <AlertConfigCard key={config.id} config={config} />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alertas</CardTitle>
              <CardDescription>
                Visualize e gerencie os alertas detectados pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="acknowledged">Reconhecido</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Severidades</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {alertsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando histórico...
                </div>
              ) : (
                <AlertHistoryTable alerts={alerts || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertSettings;
