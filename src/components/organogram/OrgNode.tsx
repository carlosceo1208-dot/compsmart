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
          "bg-card border-2 border-border rounded-lg p-4 min-w-[200px] shadow-sm",
          "hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{name}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
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
        "bg-card border rounded-lg p-3 min-w-[180px] shadow-sm",
        "hover:shadow-md hover:border-primary/50 transition-all cursor-pointer",
        isManager && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="text-xs bg-muted">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{name}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
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
