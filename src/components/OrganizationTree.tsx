import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgEntity {
  id: string;
  name: string;
  code: string | null;
  type: string;
  description: string | null;
  parent_id: string | null;
}

interface OrganizationTreeProps {
  entities: OrgEntity[];
  onEdit: (entityId: string) => void;
}

interface TreeNodeProps {
  entity: OrgEntity;
  children: OrgEntity[];
  allEntities: OrgEntity[];
  onEdit: (entityId: string) => void;
  level: number;
}

const getTypeBadge = (type: string) => {
  const typeColors: Record<string, string> = {
    company: "bg-primary/10 text-primary border-primary/20",
    headquarters: "bg-primary/10 text-primary border-primary/20",
    branch: "bg-info/10 text-info border-info/20",
    area: "bg-warning/10 text-warning border-warning/20",
    department: "bg-success/10 text-success border-success/20",
    sector: "bg-accent/10 text-accent-foreground border-accent/20",
    project: "bg-muted text-muted-foreground border-muted",
  };

  const typeLabels: Record<string, string> = {
    company: "Empresa",
    headquarters: "Matriz",
    branch: "Filial",
    area: "Área",
    department: "Departamento",
    sector: "Setor",
    project: "Projeto",
  };

  return (
    <Badge variant="outline" className={cn("text-xs", typeColors[type] || "")}>
      {typeLabels[type] || type}
    </Badge>
  );
};

function TreeNode({ entity, children, allEntities, onEdit, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const hasChildren = children.length > 0;
  const paddingLeft = level * 24;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group",
          level === 0 && "bg-muted/30"
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        <div className="flex-1 flex items-center gap-3">
          <span className="font-medium">{entity.name}</span>
          {entity.code && (
            <span className="text-xs text-muted-foreground">({entity.code})</span>
          )}
          {getTypeBadge(entity.type)}
          {entity.description && (
            <span className="text-xs text-muted-foreground italic truncate max-w-md">
              {entity.description}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onEdit(entity.id)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>

      {expanded && hasChildren && (
        <div className="border-l-2 border-muted ml-3">
          {children.map((child) => {
            const grandChildren = allEntities.filter((e) => e.parent_id === child.id);
            return (
              <TreeNode
                key={child.id}
                entity={child}
                children={grandChildren}
                allEntities={allEntities}
                onEdit={onEdit}
                level={level + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OrganizationTree({ entities, onEdit }: OrganizationTreeProps) {
  // Find root entities (those without a parent)
  const rootEntities = entities.filter((e) => !e.parent_id);

  if (entities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma entidade encontrada</p>
        <p className="text-sm mt-2">Crie uma nova entidade para começar a construir sua estrutura organizacional</p>
      </div>
    );
  }

  if (rootEntities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma entidade raiz encontrada</p>
        <p className="text-sm mt-2">Certifique-se de ter pelo menos uma entidade sem pai (como uma Empresa)</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rootEntities.map((root) => {
        const children = entities.filter((e) => e.parent_id === root.id);
        return (
          <TreeNode
            key={root.id}
            entity={root}
            children={children}
            allEntities={entities}
            onEdit={onEdit}
            level={0}
          />
        );
      })}
    </div>
  );
}
