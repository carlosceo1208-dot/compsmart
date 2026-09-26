import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserSearch, ArrowRight, Briefcase, Users, Globe, FileText } from "lucide-react";
import { useVagas } from "@/hooks/useVagas";

/** Card do módulo Recrutamento & Seleção no dashboard executivo. */
export function RecrutamentoModuleCard() {
  const { data: vagas } = useVagas();
  const publicadas = (vagas ?? []).filter((v) => v.status === "publicada").length;
  const rascunhos = (vagas ?? []).filter((v) => v.status === "rascunho").length;

  const shortcuts = [
    { to: "/recrutamento/vagas", label: "Vagas", icon: Briefcase },
    { to: "/recrutamento/candidatos", label: "Candidatos", icon: Users },
    { to: "/vagas", label: "Portal", icon: Globe },
    { to: "/modulos/selecao-rs", label: "Sobre", icon: FileText },
  ];

  return (
    <Card className="overflow-hidden border-2 border-sky-200/60 dark:border-sky-800/30 bg-gradient-to-br from-sky-50 via-white to-sky-50 dark:from-sky-950/30 dark:via-background dark:to-sky-950/30 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl shadow-lg shrink-0">
              <UserSearch className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-sky-900 dark:text-sky-100 leading-tight">
                Recrutamento &amp; Seleção
              </h3>
              <p className="text-sm text-muted-foreground">Aquisição de Talentos</p>
            </div>
          </div>
          <Badge className="bg-sky-100 text-sky-700 border-sky-200 shrink-0">
            {publicadas} publicada{publicadas === 1 ? "" : "s"}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {shortcuts.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="flex flex-col items-center p-2 rounded-lg bg-white/60 dark:bg-background/50 hover:bg-white dark:hover:bg-background transition-colors"
            >
              <s.icon className="h-4 w-4 text-sky-600 mb-1" />
              <span className="text-xs text-muted-foreground text-center">{s.label}</span>
            </Link>
          ))}
        </div>

        {rascunhos > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            {rascunhos} vaga{rascunhos === 1 ? "" : "s"} em rascunho aguardando publicação.
          </p>
        )}

        <Link to="/recrutamento/vagas">
          <Button className="w-full gap-2 bg-sky-600 hover:bg-sky-700">
            Acessar Módulo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
