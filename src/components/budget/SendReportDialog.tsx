import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

interface SendReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: {
    fiscalYear: number;
    statusFilter: string;
    unitFilter: string;
    totalPending: number;
    totalApproved: number;
    totalBudget: number;
    submissions: Array<{
      unitName: string;
      status: string;
      submittedBy: string;
      submittedAt: string;
      reviewedBy: string;
      totalAnnual: number;
    }>;
  };
}

export function SendReportDialog({ open, onOpenChange, reportData }: SendReportDialogProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [customEmail, setCustomEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Buscar todos os usuários com roles de Admin e HR
  const { data: approvers, isLoading } = useQuery({
    queryKey: ['approvers'],
    queryFn: async () => {
      // Buscar usuários com roles de admin ou hr_manager
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'hr_manager']);

      if (!userRoles || userRoles.length === 0) return [];

      const userIds = [...new Set(userRoles.map(ur => ur.user_id))];

      // Buscar perfis dos usuários
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      return profiles || [];
    },
    enabled: open,
  });

  const handleToggleRecipient = (email: string) => {
    setSelectedRecipients(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleAddCustomEmail = () => {
    if (!customEmail) return;
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customEmail)) {
      toast.error('Email inválido');
      return;
    }

    if (selectedRecipients.includes(customEmail)) {
      toast.error('Email já adicionado');
      return;
    }

    setSelectedRecipients(prev => [...prev, customEmail]);
    setCustomEmail('');
    toast.success('Email adicionado');
  };

  const handleSendReport = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Selecione pelo menos um destinatário');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-budget-report', {
        body: {
          recipients: selectedRecipients,
          fiscalYear: reportData.fiscalYear,
          statusFilter: reportData.statusFilter,
          unitFilter: reportData.unitFilter,
          reportData: {
            totalPending: reportData.totalPending,
            totalApproved: reportData.totalApproved,
            totalBudget: reportData.totalBudget,
            submissions: reportData.submissions,
          },
        },
      });

      if (error) throw error;

      toast.success(data.message || 'Relatório enviado com sucesso!');
      onOpenChange(false);
      setSelectedRecipients([]);
    } catch (error: any) {
      console.error('Error sending report:', error);
      toast.error('Erro ao enviar relatório: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Enviar Relatório por Email
          </DialogTitle>
          <DialogDescription>
            Selecione os destinatários que receberão o relatório de aprovações
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de Aprovadores */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Aprovadores (Admin e RH)
            </Label>
            <ScrollArea className="h-40 border rounded-md p-3">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Carregando...
                </div>
              ) : approvers && approvers.length > 0 ? (
                <div className="space-y-2">
                  {approvers.map((approver) => (
                    <div key={approver.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={approver.id}
                        checked={selectedRecipients.includes(approver.email)}
                        onCheckedChange={() => handleToggleRecipient(approver.email)}
                      />
                      <Label
                        htmlFor={approver.id}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {approver.full_name}
                        <span className="text-muted-foreground ml-2">
                          ({approver.email})
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum aprovador encontrado
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Email Customizado */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Adicionar Email Customizado
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomEmail()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCustomEmail}
              >
                Adicionar
              </Button>
            </div>
          </div>

          {/* Emails Selecionados */}
          {selectedRecipients.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Destinatários Selecionados ({selectedRecipients.length})
              </Label>
              <div className="text-sm text-muted-foreground">
                {selectedRecipients.join(', ')}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSendReport}
            disabled={isSending || selectedRecipients.length === 0}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Enviar Relatório
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
