import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Plus, Search, Loader2, Building2, Users, Briefcase, User } from "lucide-react";
import { usePerformanceGoals, goalLevelLabels, type GoalWithRelations } from "@/hooks/usePerformanceGoals";
import { GoalDialog } from "@/components/performance/GoalDialog";
import { GoalCard } from "@/components/performance/GoalCard";

const levelIcons = {
  company: Building2,
  area: Users,
  department: Briefcase,
  position: Briefcase,
  individual: User,
};

export default function PerformanceGoals() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("company");

  const { goals, isLoading } = usePerformanceGoals({ level: activeTab as any });

  const filteredGoals = goals.filter((goal) => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (goal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const handleEdit = (goal: GoalWithRelations) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGoal(null);
  };

  const handleNewGoal = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const handleUpdateProgress = (goal: GoalWithRelations) => {
    // For now, open the edit dialog - can be enhanced with a dedicated progress dialog
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const levels = Object.entries(goalLevelLabels) as [keyof typeof goalLevelLabels, string][];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Metas Cascateadas
          </h1>
          <p className="text-sm text-muted-foreground">
            Defina metas da empresa até o nível individual
          </p>
        </div>
        <Button 
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={handleNewGoal}
        >
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar metas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs por Nível */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          {levels.map(([key, label]) => {
            const Icon = levelIcons[key];
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {levels.map(([key, label]) => (
          <TabsContent key={key} value={key} className="mt-4">
            {isLoading ? (
              <Card className="border-indigo-200/50 dark:border-indigo-800/30">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                  <p className="text-sm text-muted-foreground">Carregando metas...</p>
                </CardContent>
              </Card>
            ) : filteredGoals.length === 0 ? (
              <Card className="border-indigo-200/50 dark:border-indigo-800/30">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Target className="h-16 w-16 text-indigo-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm ? "Nenhuma meta encontrada" : `Nenhuma meta de ${label} cadastrada`}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {searchTerm 
                      ? "Tente ajustar os termos de busca"
                      : `Crie metas de nível ${label.toLowerCase()} para acompanhar o desempenho`
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                      onClick={handleNewGoal}
                    >
                      <Plus className="h-4 w-4" />
                      Criar Meta de {label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => handleEdit(goal)}
                    onUpdateProgress={() => handleUpdateProgress(goal)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog */}
      <GoalDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        goal={editingGoal}
        defaultLevel={activeTab as any}
      />
    </div>
  );
}
