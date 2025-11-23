import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, MoreVertical, Pencil, Trash2, ToggleLeft, ToggleRight, Globe } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type KnowledgeDocument = Tables<"knowledge_base">;

interface DocumentCardProps {
  document: KnowledgeDocument;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onPreview: () => void;
}

const getAgentBadge = (agentType: string) => {
  switch (agentType) {
    case 'legal':
      return <Badge variant="default">Jurídico</Badge>;
    case 'incentive':
      return <Badge variant="secondary">R&B</Badge>;
    case 'both':
      return <Badge variant="outline">Ambos</Badge>;
    default:
      return <Badge>{agentType}</Badge>;
  }
};

export function DocumentCard({
  document,
  onEdit,
  onDelete,
  onToggleActive,
  onPreview
}: DocumentCardProps) {
  const truncatedContent = document.content.length > 120
    ? document.content.substring(0, 120) + '...'
    : document.content;

  const displayKeywords = document.keywords?.slice(0, 5) || [];
  const remainingCount = (document.keywords?.length || 0) - 5;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${!document.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {getAgentBadge(document.agent_type)}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {document.is_active ? (
                  <>
                    <ToggleLeft className="w-4 h-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <ToggleRight className="w-4 h-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg line-clamp-2">{document.title}</h3>

        {/* Category */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>📂 {document.category}</span>
          {document.subcategory && (
            <>
              <span>•</span>
              <span>{document.subcategory}</span>
            </>
          )}
        </div>

        {/* Content Preview */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {truncatedContent}
        </p>

        {/* Keywords */}
        {displayKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {displayKeywords.map(kw => (
              <Badge key={kw} variant="outline" className="text-xs">
                {kw}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingCount}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          📅 Criado em {new Date(document.created_at || '').toLocaleDateString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
}
