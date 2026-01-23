import { OrgNode } from "./OrgNode";
import { PersonTooltip } from "./PersonTooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface OrgEntity {
  id: string;
  name: string;
  description?: string;
  type: string;
  code?: string;
  parent_id: string | null;
  children?: OrgEntity[];
  employees?: Employee[];
}

interface Employee {
  id: string;
  full_name: string;
  email?: string;
  phone?: string | null;
  job_title?: string | null;
  grade?: string | null;
  avatar_url?: string | null;
  unit_id?: string | null;
  manager_id?: string | null;
  salary?: number | null;
}

interface OrgTreeProps {
  data: OrgEntity[];
  viewMode: 'entities' | 'employees' | 'hybrid';
  showPhotos: boolean;
  onNodeClick?: (node: OrgEntity | Employee) => void;
}

export function OrgTree({ data, viewMode, showPhotos, onNodeClick }: OrgTreeProps) {
  const renderNode = (node: OrgEntity, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const hasEmployees = node.employees && node.employees.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Nó da Entidade */}
        {(viewMode === 'entities' || viewMode === 'hybrid') && (
          <OrgNode
            type="entity"
            name={['headquarters', 'branch', 'area', 'department', 'sector', 'project'].includes(node.type) 
              ? (node.description || node.name) 
              : node.name}
            subtitle={node.code}
            employeeCount={node.employees?.length}
            onClick={() => onNodeClick?.(node)}
          />
        )}

        {/* Linha conectora */}
        {(hasChildren || hasEmployees) && (
          <div className="h-8 w-0.5 bg-border" />
        )}

        {/* Colaboradores da Unidade */}
        {hasEmployees && (viewMode === 'employees' || viewMode === 'hybrid') && (
          <div className="flex flex-wrap gap-4 justify-center mb-4">
            {node.employees!.map((employee) => (
              <HoverCard key={employee.id} openDelay={200}>
                <HoverCardTrigger asChild>
                  <div>
                    <OrgNode
                      type="person"
                      name={employee.full_name}
                      subtitle={employee.job_title || undefined}
                      avatarUrl={showPhotos ? employee.avatar_url : undefined}
                      grade={employee.grade || undefined}
                      isManager={node.employees?.some(e => e.manager_id === employee.id)}
                      onClick={() => onNodeClick?.(employee)}
                    />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="right" className="p-0 border-0">
                  <PersonTooltip
                    name={employee.full_name}
                    email={employee.email}
                    phone={employee.phone}
                    jobTitle={employee.job_title}
                    grade={employee.grade}
                    unitName={node.name}
                    avatarUrl={employee.avatar_url}
                  />
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        )}

        {/* Sub-entidades */}
        {hasChildren && (
          <div className="flex gap-8 justify-center">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma estrutura organizacional encontrada
      </div>
    );
  }

  return (
    <div className="overflow-auto p-8">
      <div className="inline-flex flex-col items-center min-w-full">
        {data.map((root) => renderNode(root))}
      </div>
    </div>
  );
}
