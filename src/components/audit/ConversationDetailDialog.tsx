import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { ConversationLog } from '@/hooks/useAuditLogs';
import jsPDF from 'jspdf';

interface ConversationDetailDialogProps {
  log: ConversationLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConversationDetailDialog = ({ log, open, onOpenChange }: ConversationDetailDialogProps) => {
  if (!log) return null;

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Detalhes da Consulta - Agente Smart', 14, 20);

    doc.setFontSize(10);
    doc.text(`Data: ${format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, 14, 30);
    doc.text(`Usuário: ${log.user_name} (${log.user_email})`, 14, 36);
    doc.text(`Agente: ${log.agent_type === 'legal' ? 'Jurídico' : 'Remuneração & Benefícios'}`, 14, 42);
    doc.text(`Modo: ${log.operation_mode || 'N/A'}`, 14, 48);
    doc.text(`Tokens: ${log.tokens_used} | Tempo: ${log.response_time_ms}ms`, 14, 54);

    doc.setFontSize(12);
    doc.text('Pergunta:', 14, 64);
    
    doc.setFontSize(10);
    const splitQuestion = doc.splitTextToSize(log.question, 180);
    doc.text(splitQuestion, 14, 70);

    doc.addPage();
    doc.setFontSize(12);
    doc.text('Resposta:', 14, 20);
    
    doc.setFontSize(10);
    const splitAnswer = doc.splitTextToSize(log.answer, 180);
    doc.text(splitAnswer, 14, 26);

    doc.save(`Consulta_${log.id}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes da Consulta</DialogTitle>
            <Badge variant={log.agent_type === 'legal' ? 'default' : 'secondary'}>
              {log.agent_type === 'legal' ? 'Jurídico' : 'R&B'}
            </Badge>
          </div>
          <DialogDescription>
            {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <Label className="text-xs text-muted-foreground">Usuário</Label>
            <p className="font-medium">{log.user_name}</p>
            <p className="text-sm text-muted-foreground">{log.user_email}</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Empresa</Label>
            <p className="font-medium">{log.company_name}</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Modo de Operação</Label>
            <Badge variant="outline" className="mt-1">
              {log.operation_mode || 'N/A'}
            </Badge>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Métricas</Label>
            <p className="text-sm">
              <span className="font-mono">{log.tokens_used}</span> tokens · 
              <span className="font-mono ml-2">{log.response_time_ms}ms</span>
            </p>
          </div>

          {log.document_name && (
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Documento Anexo</Label>
              <p className="text-sm">{log.document_name}</p>
            </div>
          )}
        </div>

        <Separator />

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Pergunta do Usuário</Label>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{log.question}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">Resposta do Agente</Label>
              <div className="bg-muted/50 p-4 rounded-md prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{log.answer}</ReactMarkdown>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={exportToPDF}>
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
