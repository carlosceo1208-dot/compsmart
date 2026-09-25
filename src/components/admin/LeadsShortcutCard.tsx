import { Inbox, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNewLeadsCount } from "@/hooks/useNewLeadsCount";

/** Atalho com contador para a gestão de leads do site. */
export const LeadsShortcutCard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, newLeads } = useNewLeadsCount();

  if (!isSuperAdmin) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <Inbox className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">Leads do Site</p>
            {newLeads > 0 && (
              <Badge className="bg-destructive text-destructive-foreground border-0">
                {newLeads} {newLeads === 1 ? "novo" : "novos"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {newLeads > 0
              ? "Contatos do site aguardando retorno."
              : "Nenhum contato novo aguardando retorno."}
          </p>
        </div>
        <Button onClick={() => navigate("/admin/leads")}>
          Abrir leads
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
