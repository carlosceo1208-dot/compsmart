import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { AlertConfig, useUpdateAlertConfig, alertTypeLabels } from '@/hooks/useAlertConfigs';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AlertConfigCardProps {
  config: AlertConfig;
}

export const AlertConfigCard = ({ config }: AlertConfigCardProps) => {
  const updateConfig = useUpdateAlertConfig();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [thresholdValue, setThresholdValue] = useState(config.threshold_value);
  const [recipients, setRecipients] = useState(config.recipients.join(', '));

  const alertInfo = alertTypeLabels[config.alert_type];
  
  const severityColors = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500'
  };

  const handleToggle = (enabled: boolean) => {
    updateConfig.mutate({ id: config.id, updates: { enabled } });
  };

  const handleSaveConfig = () => {
    updateConfig.mutate({
      id: config.id,
      updates: {
        threshold_value: thresholdValue,
        recipients: recipients.split(',').map(r => r.trim()).filter(Boolean)
      }
    });
    setIsEditOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{alertInfo.icon}</span>
              {alertInfo.title}
            </CardTitle>
            <CardDescription>{alertInfo.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={severityColors[config.severity]}>
              {config.severity.toUpperCase()}
            </Badge>
            <Switch
              checked={config.enabled}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Threshold:</span>{' '}
            {config.threshold_value}
            {config.threshold_unit === 'percentage' ? '%' : config.threshold_unit === 'days' ? ' dias' : ''}
          </div>
          <div>
            <span className="font-medium">Destinatários:</span>{' '}
            {config.recipients.slice(0, 2).join(', ')}
            {config.recipients.length > 2 && ` +${config.recipients.length - 2}`}
          </div>
          <div>
            <span className="font-medium">Frequência:</span> {config.check_frequency}
          </div>
          
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-2">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurar Alerta</DialogTitle>
                <DialogDescription>
                  Ajuste o threshold e os destinatários para este alerta
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="threshold">
                    Threshold {config.threshold_unit === 'percentage' ? '(%)' : config.threshold_unit === 'days' ? '(dias)' : ''}
                  </Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="recipients">Destinatários (separados por vírgula)</Label>
                  <Input
                    id="recipients"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>
                <Button onClick={handleSaveConfig} className="w-full">
                  Salvar Configurações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
