import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PerformanceEmployee } from "@/hooks/usePerformanceEmployees";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Target, TrendingUp, ClipboardCheck, Users, MessageSquare, Calendar } from "lucide-react";

interface EmployeeDrawerProps {
  employee: PerformanceEmployee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function EmployeeDrawer({ employee, open, onOpenChange }: EmployeeDrawerProps) {
  // Buscar metas do colaborador
  const { data: goals = [] } = useQuery({
    queryKey: ["employee-goals", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      const { data, error } = await supabase
        .from("performance_goals")
        .select("*")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!employee?.id && open,
  });

  // Buscar PDIs do colaborador
  const { data: pdis = [] } = useQuery({
    queryKey: ["employee-pdis", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      const { data, error } = await supabase
        .from("performance_pdi")
        .select("*")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!employee?.id && open,
  });

  // Buscar avaliações do colaborador
  const { data: evaluations = [] } = useQuery({
    queryKey: ["employee-evaluations", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      const { data, error } = await supabase
        .from("performance_evaluations")
        .select("*, performance_cycles(name)")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!employee?.id && open,
  });

  // Buscar 1:1s do colaborador
  const { data: oneOnOnes = [] } = useQuery({
    queryKey: ["employee-one-on-ones", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      const { data, error } = await supabase
        .from("performance_one_on_ones")
        .select("*")
        .eq("employee_id", employee.id)
        .order("scheduled_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!employee?.id && open,
  });

  // Buscar feedbacks 360 do colaborador
  const { data: feedbacks = [] } = useQuery({
    queryKey: ["employee-feedbacks-360", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      const { data, error } = await supabase
        .from("external_feedback_requests")
        .select("*, external_feedback_responses(*)")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!employee?.id && open,
  });

  if (!employee) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.avatar_url || undefined} alt={employee.full_name} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xl">
                {getInitials(employee.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-xl">{employee.full_name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{employee.job_title || "Sem cargo"}</p>
              {employee.grade && (
                <Badge variant="outline" className="mt-1">
                  Grade: {employee.grade}
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-4">
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-4">
              <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
              <TabsTrigger value="metas" className="text-xs">Metas</TabsTrigger>
              <TabsTrigger value="avaliacoes" className="text-xs">Aval.</TabsTrigger>
              <TabsTrigger value="pdi" className="text-xs">PDI</TabsTrigger>
              <TabsTrigger value="1on1" className="text-xs">1:1</TabsTrigger>
              <TabsTrigger value="360" className="text-xs">360</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unidade:</span>
                    <span>{employee.unit_name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gestor:</span>
                    <span>{employee.manager_name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admissão:</span>
                    <span>
                      {employee.hire_date
                        ? format(new Date(employee.hire_date), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Performance</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-500" />
                    <div>
                      <p className="text-lg font-bold">{employee.active_goals_count}</p>
                      <p className="text-xs text-muted-foreground">Metas ativas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-lg font-bold">{employee.active_pdi_count}</p>
                      <p className="text-xs text-muted-foreground">PDIs ativos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-lg font-bold">
                        {employee.last_evaluation_score?.toFixed(1) || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">Última nota</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-lg font-bold">{employee.pending_feedback_count}</p>
                      <p className="text-xs text-muted-foreground">Feedbacks 360</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metas" className="space-y-3">
              {goals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma meta encontrada</p>
              ) : (
                goals.map((goal: any) => (
                  <Card key={goal.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{goal.title}</p>
                          <p className="text-xs text-muted-foreground">{goal.description}</p>
                        </div>
                        <Badge variant="outline">{goal.status}</Badge>
                      </div>
                      {goal.progress_percentage !== null && (
                        <div className="mt-2">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${goal.progress_percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {goal.progress_percentage}% concluído
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="avaliacoes" className="space-y-3">
              {evaluations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma avaliação encontrada</p>
              ) : (
                evaluations.map((evaluation: any) => (
                  <Card key={evaluation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {evaluation.performance_cycles?.name || "Ciclo"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(evaluation.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{evaluation.status}</Badge>
                          {evaluation.final_score && (
                            <p className="text-lg font-bold mt-1">{evaluation.final_score.toFixed(1)}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="pdi" className="space-y-3">
              {pdis.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum PDI encontrado</p>
              ) : (
                pdis.map((pdi: any) => (
                  <Card key={pdi.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{pdi.title}</p>
                          <p className="text-xs text-muted-foreground">{pdi.description}</p>
                        </div>
                        <Badge variant="outline">{pdi.status}</Badge>
                      </div>
                      {pdi.due_date && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Prazo: {format(new Date(pdi.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="1on1" className="space-y-3">
              {oneOnOnes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma reunião 1:1 encontrada</p>
              ) : (
                oneOnOnes.map((meeting: any) => (
                  <Card key={meeting.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{meeting.title || "Reunião 1:1"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(meeting.scheduled_date), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <Badge variant="outline">{meeting.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="360" className="space-y-3">
              {feedbacks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum feedback 360 encontrado</p>
              ) : (
                feedbacks.map((feedback: any) => (
                  <Card key={feedback.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{feedback.external_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {feedback.external_type}
                          </p>
                        </div>
                        <Badge
                          variant={feedback.status === "completed" ? "default" : "secondary"}
                        >
                          {feedback.status === "completed" ? "Respondido" : "Pendente"}
                        </Badge>
                      </div>
                      {feedback.external_feedback_responses?.[0]?.overall_rating && (
                        <p className="text-sm mt-2">
                          Nota: {feedback.external_feedback_responses[0].overall_rating.toFixed(1)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
