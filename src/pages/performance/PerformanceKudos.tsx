import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Plus, Loader2, Inbox, Send, Globe } from "lucide-react";
import { usePerformanceKudos, kudosCategoryLabels } from "@/hooks/usePerformanceKudos";
import { KudosDialog } from "@/components/performance/KudosDialog";
import { KudosCard } from "@/components/performance/KudosCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

export default function PerformanceKudos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { kudos, isLoading } = usePerformanceKudos();

  // Mark received kudos as read when viewing "received" tab
  useEffect(() => {
    if (activeTab === 'received' && currentUser?.id) {
      const markAsRead = async () => {
        const unreadKudos = kudos.filter(
          k => k.to_employee_id === currentUser.id && !k.is_read
        );
        
        if (unreadKudos.length > 0) {
          await supabase
            .from('performance_kudos')
            .update({ is_read: true })
            .eq('to_employee_id', currentUser.id)
            .eq('is_read', false);
          
          // Invalidate header notifications to update badge
          queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
          queryClient.invalidateQueries({ queryKey: ['performance-kudos'] });
        }
      };
      
      markAsRead();
    }
  }, [activeTab, currentUser?.id, kudos, queryClient]);

  const filteredKudos = kudos.filter((kudo) => {
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "received" && kudo.to_employee_id === currentUser?.id) ||
      (activeTab === "sent" && kudo.from_employee_id === currentUser?.id);
    const matchesCategory = !filterCategory || kudo.category === filterCategory;
    return matchesTab && matchesCategory;
  });

  const categoryOptions = Object.entries(kudosCategoryLabels);

  // Count unread kudos for badge
  const unreadCount = kudos.filter(
    k => k.to_employee_id === currentUser?.id && !k.is_read
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Reconhecimento
          </h1>
          <p className="text-sm text-muted-foreground">
            Reconheça e celebre as conquistas dos colegas
          </p>
        </div>
        <Button 
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Enviar Reconhecimento
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-1 relative">
              <Inbox className="h-4 w-4" />
              Recebidos
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-1.5 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-1">
              <Send className="h-4 w-4" />
              Enviados
            </TabsTrigger>
          </TabsList>

          {/* Filtro por categoria */}
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={filterCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterCategory(null)}
            >
              Todas
            </Badge>
            {categoryOptions.map(([key, label]) => (
              <Badge
                key={key}
                variant={filterCategory === key ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterCategory(key)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <Card className="border-indigo-200/50 dark:border-indigo-800/30">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-sm text-muted-foreground">Carregando reconhecimentos...</p>
              </CardContent>
            </Card>
          ) : filteredKudos.length === 0 ? (
            <Card className="border-indigo-200/50 dark:border-indigo-800/30">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Award className="h-16 w-16 text-indigo-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {filterCategory ? "Nenhum reconhecimento nesta categoria" : "Nenhum reconhecimento ainda"}
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {activeTab === "received" 
                    ? "Você ainda não recebeu reconhecimentos"
                    : activeTab === "sent"
                    ? "Você ainda não enviou reconhecimentos"
                    : "Seja o primeiro a reconhecer um colega!"
                  }
                </p>
                <Button 
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Enviar Reconhecimento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredKudos.map((kudo) => (
                <KudosCard 
                  key={kudo.id} 
                  kudos={kudo} 
                  currentUserId={currentUser?.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <KudosDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
