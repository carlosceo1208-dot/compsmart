import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Edit, Building2, Home, GitBranch, Layers, Users, FolderKanban, Briefcase } from "lucide-react";
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

const getTypeIcon = (type: string) => {
  const iconClass = "w-4 h-4";
  switch (type) {
    case "company":
      return <Building2 className={iconClass} />;
    case "headquarters":
      return <Home className={iconClass} />;
    case "branch":
      return <GitBranch className={iconClass} />;
    case "area":
      return <Layers className={iconClass} />;
    case "department":
      return <Users className={iconClass} />;
    case "sector":
      return <FolderKanban className={iconClass} />;
    case "project":
      return <Briefcase className={iconClass} />;
    default:
      return <Building2 className={iconClass} />;
  }
};

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

const getTypeCardColor = (type: string) => {
  const colors: Record<string, string> = {
    company: "border-primary/40 bg-primary/5 hover:bg-primary/10",
    headquarters: "border-primary/40 bg-primary/5 hover:bg-primary/10",
    branch: "border-info/40 bg-info/5 hover:bg-info/10",
    area: "border-warning/40 bg-warning/5 hover:bg-warning/10",
    department: "border-success/40 bg-success/5 hover:bg-success/10",
    sector: "border-accent/40 bg-accent/5 hover:bg-accent/10",
    project: "border-muted bg-muted/5 hover:bg-muted/10",
  };
  return colors[type] || "border-border bg-background hover:bg-muted/50";
};

function TreeNode({ entity, children, allEntities, onEdit, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = children.length > 0;

  const sortedChildren = [...children].sort((a, b) => {
    if (a.code && b.code) {
      return a.code.localeCompare(b.code, undefined, { numeric: true });
    }
    if (a.code) return -1;
    if (b.code) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="org-node-wrapper">
      <div
        className={cn(
          "org-card border-2 rounded-lg p-4 min-w-[280px] max-w-[320px] transition-all duration-200 shadow-sm group relative",
          getTypeCardColor(entity.type)
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">{getTypeIcon(entity.type)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {entity.code && (
                <span className="font-mono font-semibold text-xs bg-background/80 px-2 py-1 rounded border border-border/50">
                  {entity.code}
                </span>
              )}
              {getTypeBadge(entity.type)}
            </div>
            
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{entity.name}</h3>
            
            {entity.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 italic">
                {entity.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Ocultar {children.length}
                </>
              ) : (
                <>
                  <ChevronRight className="w-3 h-3 mr-1" />
                  Mostrar {children.length}
                </>
              )}
            </Button>
          )}
          
          {!hasChildren && <div />}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit(entity.id)}
          >
            <Edit className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="org-children">
          {sortedChildren.map((child) => {
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
  const rootEntities = entities.filter((e) => !e.parent_id);

  if (entities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Nenhuma entidade encontrada</p>
        <p className="text-sm mt-2">Crie uma nova entidade para começar a construir sua estrutura organizacional</p>
      </div>
    );
  }

  if (rootEntities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Nenhuma entidade raiz encontrada</p>
        <p className="text-sm mt-2">Certifique-se de ter pelo menos uma entidade sem pai (como uma Empresa)</p>
      </div>
    );
  }

  const sortedRoots = [...rootEntities].sort((a, b) => {
    if (a.code && b.code) return a.code.localeCompare(b.code, undefined, { numeric: true });
    if (a.code) return -1;
    if (b.code) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="w-full overflow-x-auto pb-8 px-4 py-8">
      <div className="flex flex-col items-center gap-12 min-w-max mx-auto">
        {sortedRoots.map((root) => {
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
    </div>
  );
}
