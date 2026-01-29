import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Loader2, Calendar, CheckCircle2, Clock } from "lucide-react";
import { usePerformanceOneOnOnes, type OneOnOneWithRelations } from "@/hooks/usePerformanceOneOnOnes";
import { OneOnOneDialog } from "@/components/performance/OneOnOneDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PerformanceOneOnOnes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<OneOnOneWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  const { oneOnOnes, isLoading, completeOneOnOne } = usePerformanceOneOnOnes();

  const upcomingMeetings = oneOnOnes.filter(m => !m.is_completed);
  const completedMeetings = oneOnOnes.filter(m => m.is_completed);

  const displayMeetings = activeTab === "upcoming" ? upcomingMeetings : completedMeetings;

  const handleEdit = (meeting: OneOnOneWithRelations) => {
    setEditingMeeting(meeting);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMeeting(null);
  };

  const handleComplete = async (meetingId: string) => {
    await completeOneOnOne.mutateAsync({ id: meetingId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Reuniões 1:1
          </h1>
          <p className="text-sm text-muted-foreground">
            Agende e gerencie reuniões individuais com sua equipe
          </p>
        </div>
        <Button 
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Agendar 1:1
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Agendadas ({upcomingMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Concluídas ({completedMeetings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <Card className="border-indigo-200/50 dark:border-indigo-800/30">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-sm text-muted-foreground">Carregando reuniões...</p>
              </CardContent>
            </Card>
          ) : displayMeetings.length === 0 ? (
            <Card className="border-indigo-200/50 dark:border-indigo-800/30">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-indigo-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {activeTab === "upcoming" ? "Nenhuma reunião agendada" : "Nenhuma reunião concluída"}
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {activeTab === "upcoming" 
                    ? "Agende reuniões 1:1 para acompanhar o desenvolvimento da equipe"
                    : "As reuniões concluídas aparecerão aqui"
                  }
                </p>
                {activeTab === "upcoming" && (
                  <Button 
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Agendar Primeira Reunião
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayMeetings.map((meeting) => (
                <Card 
                  key={meeting.id} 
                  className="border-indigo-200/50 dark:border-indigo-800/30 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                          <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {meeting.employee?.full_name || "Colaborador"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(meeting.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={meeting.is_completed ? "secondary" : "default"}>
                        {meeting.is_completed ? "Concluída" : "Agendada"}
                      </Badge>
                    </div>

                    {meeting.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {meeting.notes}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEdit(meeting)}
                      >
                        {meeting.is_completed ? "Ver Detalhes" : "Editar"}
                      </Button>
                      {!meeting.is_completed && (
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleComplete(meeting.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <OneOnOneDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        oneOnOne={editingMeeting}
      />
    </div>
  );
}
