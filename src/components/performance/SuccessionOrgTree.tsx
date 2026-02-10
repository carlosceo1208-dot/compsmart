import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { readinessLabels, readinessColors, rankIcons, type SuccessionWithRelations } from "@/hooks/usePerformanceSuccession";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessionOrgTreeProps {
  groupedSuccessions: Map<string, {
    position: { id: string; title: string; grade: string; code: string } | null;
    successors: SuccessionWithRelations[];
  }>;
}

export function SuccessionOrgTree({ groupedSuccessions }: SuccessionOrgTreeProps) {
  const entries = useMemo(() => Array.from(groupedSuccessions.entries()), [groupedSuccessions]);

  if (entries.length === 0) return null;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 overflow-x-auto">
      {/* Render as a vertical tree */}
      <div className="flex flex-wrap justify-center gap-6">
        {entries.map(([positionId, { position, successors }], idx) => (
          <div key={positionId} className="flex flex-col items-center">
            {/* Position Card (titular) */}
            <Card className="border-primary/30 bg-primary/5 w-[220px] shadow-sm">
              <CardContent className="p-4 text-center space-y-1">
                <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm leading-tight">
                  {position?.title ?? "Cargo"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {position?.code} • Grade {position?.grade}
                </p>
                <Badge variant="outline" className="text-[10px]">
                  {successors.length} sucessor{successors.length !== 1 ? "es" : ""}
                </Badge>
              </CardContent>
            </Card>

            {/* Connector line */}
            {successors.length > 0 && (
              <div className="w-px h-6 bg-border" />
            )}

            {/* Successors */}
            {successors.length > 0 && (
              <div className="relative">
                {/* Horizontal connector */}
                {successors.length > 1 && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border"
                    style={{
                      width: `${Math.min(successors.length, 3) * 140 - 20}px`,
                    }}
                  />
                )}

                <div className="flex gap-3 pt-0">
                  {successors.map((s) => (
                    <div key={s.id} className="flex flex-col items-center">
                      {/* Vertical connector */}
                      <div className="w-px h-4 bg-border" />

                      <Card className="w-[130px] border-border/50 hover:shadow-md transition-shadow">
                        <CardContent className="p-3 text-center space-y-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm">{rankIcons[s.rank || 1]}</span>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={s.successor?.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(s.successor?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <p className="text-xs font-medium leading-tight truncate" title={s.successor?.full_name ?? undefined}>
                            {s.successor?.full_name ?? "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {s.successor?.job_title}
                            {s.successor?.grade && ` • G${s.successor.grade}`}
                          </p>
                          <Badge className={cn("text-[9px] px-1.5 py-0", readinessColors[s.readiness])}>
                            {readinessLabels[s.readiness]}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
