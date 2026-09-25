import { Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNewLeadsCount } from "@/hooks/useNewLeadsCount";

/** Atalho para /admin/leads com contador de leads novos (somente super admin). */
export const HeaderLeadsButton = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, newLeads } = useNewLeadsCount();

  if (!isSuperAdmin) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-full"
      onClick={() => navigate("/admin/leads")}
      aria-label={
        newLeads > 0
          ? `Leads do site: ${newLeads} novo(s)`
          : "Leads do site"
      }
      title="Leads do site"
    >
      <Inbox className="h-5 w-5" />
      {newLeads > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground border-0">
          {newLeads > 9 ? "9+" : newLeads}
        </Badge>
      )}
    </Button>
  );
};
