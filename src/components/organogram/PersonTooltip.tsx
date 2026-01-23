import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Briefcase, Building2 } from "lucide-react";

interface PersonTooltipProps {
  name: string;
  email?: string;
  phone?: string | null;
  jobTitle?: string | null;
  grade?: string | null;
  unitName?: string | null;
  avatarUrl?: string | null;
  salary?: number | null;
}

export function PersonTooltip({
  name,
  email,
  phone,
  jobTitle,
  grade,
  unitName,
  avatarUrl,
  salary
}: PersonTooltipProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-16 w-16">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="text-lg bg-primary text-primary-foreground">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{name}</h4>
          {grade && (
            <Badge variant="outline" className="mt-1">
              {grade}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {jobTitle && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{jobTitle}</span>
          </div>
        )}
        
        {unitName && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{unitName}</span>
          </div>
        )}
        
        {email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
        
        {phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
