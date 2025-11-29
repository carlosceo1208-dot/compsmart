import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgNodeProps {
  type: 'entity' | 'person';
  name: string;
  subtitle?: string;
  avatarUrl?: string | null;
  employeeCount?: number;
  grade?: string;
  isManager?: boolean;
  onClick?: () => void;
}

const truncateJobTitle = (title: string, maxLength: number = 25): string => {
  if (!title || title.length <= maxLength) return title;
  
  const abbreviations: Record<string, string> = {
    'Coordenador': 'Coord.',
    'Coordenadora': 'Coord.',
    'Gerente': 'Ger.',
    'Diretor': 'Dir.',
    'Diretora': 'Dir.',
    'Analista': 'Anal.',
    'Assistente': 'Assist.',
    'Supervisor': 'Superv.',
    'Supervisora': 'Superv.',
    'Especialista': 'Espec.',
    'Administrador': 'Adm.',
    'Administradora': 'Adm.',
    'Desenvolvedor': 'Dev.',
    'Desenvolvedora': 'Dev.',
    'Engenheiro': 'Eng.',
    'Engenheira': 'Eng.',
    'Técnico': 'Téc.',
    'Técnica': 'Téc.',
  };

  let abbreviated = title;
  for (const [full, short] of Object.entries(abbreviations)) {
    abbreviated = abbreviated.replace(new RegExp(full, 'gi'), short);
  }

  return abbreviated.length > maxLength 
    ? abbreviated.slice(0, maxLength - 3) + '...'
    : abbreviated;
};

export function OrgNode({
  type,
  name,
  subtitle,
  avatarUrl,
  employeeCount,
  grade,
  isManager,
  onClick
}: OrgNodeProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (type === 'entity') {
    return (
      <div
        onClick={onClick}
        className={cn(
          "bg-card border-2 border-border rounded-lg p-4 w-[200px] shadow-sm",
          "hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" title={name}>{name}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate" title={subtitle}>{subtitle}</p>
            )}
          </div>
        </div>
        
        {employeeCount !== undefined && employeeCount > 0 && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{employeeCount} {employeeCount === 1 ? 'colaborador' : 'colaboradores'}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card border rounded-lg p-3 w-[180px] shadow-sm",
        "hover:shadow-md hover:border-primary/50 transition-all cursor-pointer",
        isManager && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="text-xs bg-muted">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" title={name}>{name}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate" title={subtitle}>
              {truncateJobTitle(subtitle)}
            </p>
          )}
          {grade && (
            <Badge variant="outline" className="mt-1 text-xs">
              {grade}
            </Badge>
          )}
        </div>
      </div>
      
      {isManager && (
        <Badge variant="secondary" className="mt-2 text-xs">
          Gestor
        </Badge>
      )}
    </div>
  );
}
