import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useJobMatchingResults } from "@/hooks/useJobMatching";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export const JobMatchingCard = () => {
  const { data: matches, isLoading } = useJobMatchingResults();
  const { role } = useCurrentUserRole();
  const allowed = role === "admin" || role === "hr_manager";
  if (!allowed) return null;

  const top = (matches ?? []).slice(0, 3);
  const avgScore = matches?.length
    ? Math.round(
        matches.reduce((s, m) => s + Number(m.match_score), 0) / matches.length
      )
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Match — AI Job Matching
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Equivalência inteligente entre cargos internos e mercado
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/job-matching">
            Abrir <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : matches && matches.length > 0 ? (
          <>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">
                Cargos analisados
              </span>
              <div className="flex items-center gap-3">
                <span className="font-bold">{matches.length}</span>
                <Badge variant="secondary">Score médio: {avgScore}%</Badge>
              </div>
            </div>
            <div className="space-y-2">
              {top.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between border rounded-md p-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {m.job_title?.title ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      → {m.matched_market_role}
                    </div>
                  </div>
                  <Badge
                    variant={
                      m.match_score >= 80
                        ? "default"
                        : m.match_score >= 60
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {Math.round(Number(m.match_score))}%
                  </Badge>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum matching executado ainda. Acesse a página para rodar a IA.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
