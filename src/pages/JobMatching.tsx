import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  ClipboardCheck,
  History,
} from "lucide-react";
import {
  JobMatchingResult,
  useJobMatchingResults,
  useRunJobMatching,
} from "@/hooks/useJobMatching";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { JobMatchingReviewDialog } from "@/components/match/JobMatchingReviewDialog";
import { JobMatchingHistoryDialog } from "@/components/match/JobMatchingHistoryDialog";
import { useCompanyContext } from "@/contexts/CompanyContext";

interface JobTitleRow {
  id: string;
  title: string;
  code: string;
  grade: string;
  job_family: string;
}

export default function JobMatching() {
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();
  const allowed = roleData?.isAdmin || roleData?.isHR;

  const [jobs, setJobs] = useState<JobTitleRow[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);

  const { data: matches, isLoading: matchesLoading } = useJobMatchingResults();
  const runMatch = useRunJobMatching();

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const { data } = await supabase
        .from("job_titles")
        .select("id, title, code, grade, job_family")
        .eq("is_active", true)
        .order("title");
      setJobs((data ?? []) as JobTitleRow[]);
      setLoadingJobs(false);
    })();
  }, [allowed]);

  if (roleLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!allowed) return <Navigate to="/dashboard" replace />;

  const matchedById = new Map(
    (matches ?? []).map((m) => [m.job_title_id, m] as const)
  );

  const handleRun = async (id: string) => {
    setRunningId(id);
    try {
      await runMatch.mutateAsync(id);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          AI Job Matching
        </h1>
        <p className="text-muted-foreground mt-1">
          Compare cargos internos com o mercado usando IA. A análise considera
          responsabilidades, requisitos e dados da pesquisa salarial ativa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cargos da empresa</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingJobs || matchesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cargo Interno</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Match de Mercado</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-right">Gap %</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((j) => {
                    const m = matchedById.get(j.id);
                    return (
                      <TableRow key={j.id}>
                        <TableCell className="font-medium">
                          {j.title}
                          <div className="text-xs text-muted-foreground">
                            {j.code} · {j.job_family}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{j.grade}</Badge>
                        </TableCell>
                        <TableCell>
                          {m ? (
                            <div>
                              <div className="font-medium">
                                {m.matched_market_role}
                              </div>
                              {m.matched_cbo_code && (
                                <div className="text-xs text-muted-foreground">
                                  CBO {m.matched_cbo_code}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Não analisado
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {m ? (
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
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {m?.gap_pct != null ? (
                            <span
                              className={
                                Math.abs(Number(m.gap_pct)) > 15
                                  ? "text-destructive font-medium inline-flex items-center gap-1"
                                  : ""
                              }
                            >
                              {Math.abs(Number(m.gap_pct)) > 15 && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {Number(m.gap_pct) > 0 ? "+" : ""}
                              {Number(m.gap_pct).toFixed(1)}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={m ? "outline" : "default"}
                            disabled={runningId === j.id}
                            onClick={() => handleRun(j.id)}
                          >
                            {runningId === j.id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Analisando
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 mr-1" />
                                {m ? "Re-analisar" : "Analisar"}
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {jobs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-6"
                      >
                        Nenhum cargo cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {matches && matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Justificativas e Recomendações da IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {matches.map((m) => (
              <div key={m.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {m.job_title?.title} → {m.matched_market_role}
                  </div>
                  <Badge>{Math.round(Number(m.match_score))}% match</Badge>
                </div>
                {m.reasoning && (
                  <p className="text-sm">
                    <strong>Justificativa:</strong> {m.reasoning}
                  </p>
                )}
                {m.recommendations && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Recomendações:</strong> {m.recommendations}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
