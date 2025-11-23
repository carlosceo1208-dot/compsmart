import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Tables } from "@/integrations/supabase/types";

type KnowledgeDocument = Tables<"knowledge_base">;

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: KnowledgeDocument | null;
}

const getAgentLabel = (agentType: string) => {
  switch (agentType) {
    case 'legal':
      return 'Jurídico';
    case 'incentive':
      return 'Remuneração & Benefícios';
    case 'both':
      return 'Ambos';
    default:
      return agentType;
  }
};

const getAgentVariant = (agentType: string): "default" | "secondary" | "outline" => {
  switch (agentType) {
    case 'legal':
      return 'default';
    case 'incentive':
      return 'secondary';
    case 'both':
      return 'outline';
    default:
      return 'default';
  }
};

export function DocumentPreviewDialog({ open, onOpenChange, document }: DocumentPreviewDialogProps) {
  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-2xl">{document.title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getAgentVariant(document.agent_type)}>
                {getAgentLabel(document.agent_type)}
              </Badge>
              {document.is_global && (
                <Badge variant="outline" className="gap-1">
                  <Globe className="w-3 h-3" />
                  Global
                </Badge>
              )}
              {!document.is_active && (
                <Badge variant="destructive">Inativo</Badge>
              )}
            </div>
          </div>
          <DialogDescription className="text-base">
            {document.category}
            {document.subcategory && ` • ${document.subcategory}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{document.content}</ReactMarkdown>
          </div>
        </ScrollArea>

        {/* Keywords Section */}
        {document.keywords && document.keywords.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <Label className="text-xs text-muted-foreground">Keywords</Label>
            <div className="flex flex-wrap gap-2">
              {document.keywords.map(kw => (
                <Badge key={kw} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
          <div>📅 Criado em: {new Date(document.created_at || '').toLocaleString('pt-BR')}</div>
          <div>🔄 Atualizado em: {new Date(document.updated_at || '').toLocaleString('pt-BR')}</div>
          {document.source_document && (
            <div>📄 Fonte: {document.source_document}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
