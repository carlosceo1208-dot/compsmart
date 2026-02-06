import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Plus, Search, Loader2, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
import { 
  usePerformanceSuccession, 
  readinessLabels, 
  readinessColors, 
  rankIcons,
  type SuccessionWithRelations 
} from "@/hooks/usePerformanceSuccession";
import { SuccessionDialog } from "@/components/performance/SuccessionDialog";
import { KeyPositionDetailPanel } from "@/components/performance/KeyPositionDetailPanel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function PerformanceSuccession() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSuccession, setEditingSuccession] = useState<SuccessionWithRelations | null>(null);
  const [preselectedPositionId, setPreselectedPositionId] = useState<string | undefined>();
  const [preselectedRank, setPreselectedRank] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReadiness, setFilterReadiness] = useState<string | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);

  const { successions, isLoading, deleteSuccession } = usePerformanceSuccession();

  // Group successions by key position
  const groupedSuccessions = useMemo(() => {
    const filtered = successions.filter((s) => {
      const matchesSearch = 
        (s.key_position?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (s.successor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesReadiness = !filterReadiness || s.readiness === filterReadiness;
      return matchesSearch && matchesReadiness;
    });

    const grouped = new Map<string, {
      position: { id: string; title: string; grade: string; code: string } | null;
      successors: SuccessionWithRelations[];
    }>();

    filtered.forEach(s => {
      const positionId = s.key_position_id;
      if (!grouped.has(positionId)) {
        grouped.set(positionId, {
          position: s.key_position ? { ...s.key_position, id: positionId } : null,
          successors: []
        });
      }
      grouped.get(positionId)!.successors.push(s);
    });

    // Sort successors by rank within each group
    grouped.forEach(group => {
      group.successors.sort((a, b) => (a.rank || 1) - (b.rank || 1));
    });

    return grouped;
  }, [successions, searchTerm, filterReadiness]);

  const handleEdit = (succession: SuccessionWithRelations) => {
    setEditingSuccession(succession);
    setPreselectedPositionId(undefined);
    setPreselectedRank(undefined);
    setDialogOpen(true);
  };

  const handleAddToPosition = (positionId: string, existingRanks: number[]) => {
    const nextRank = [1, 2, 3].find(r => !existingRanks.includes(r)) || 1;
    setEditingSuccession(null);
    setPreselectedPositionId(positionId);
    setPreselectedRank(nextRank);
    setDialogOpen(true);
  };

  const handleNewMapping = () => {
    setEditingSuccession(null);
    setPreselectedPositionId(undefined);
    setPreselectedRank(undefined);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSuccession(null);
    setPreselectedPositionId(undefined);
    setPreselectedRank(undefined);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este mapeamento de sucessão?")) {
      await deleteSuccession.mutateAsync(id);
    }
  };

  const readinessOptions = Object.entries(readinessLabels);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Plano de Sucessão
          </h1>
          <p className="text-sm text-muted-foreground">
            Identifique e prepare sucessores para posições-chave
          </p>
        </div>
        <Button 
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={handleNewMapping}
        >
          <Plus className="h-4 w-4" />
          Mapear Sucessão
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cargo ou sucessor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={filterReadiness === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterReadiness(null)}
          >
            Todos
          </Badge>
          {readinessOptions.map(([key, label]) => (
            <Badge
              key={key}
              variant={filterReadiness === key ? "default" : "outline"}
              className={`cursor-pointer ${filterReadiness === key ? readinessColors[key as keyof typeof readinessColors] : ""}`}
              onClick={() => setFilterReadiness(key)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-muted-foreground">Carregando mapeamentos...</p>
          </CardContent>
        </Card>
      ) : groupedSuccessions.size === 0 ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserPlus className="h-16 w-16 text-indigo-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || filterReadiness ? "Nenhum mapeamento encontrado" : "Nenhum mapeamento cadastrado"}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {searchTerm || filterReadiness 
                ? "Tente ajustar os filtros de busca"
                : "Identifique posições-chave e potenciais sucessores"
              }
            </p>
            {!searchTerm && !filterReadiness && (
              <Button 
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleNewMapping}
              >
                <Plus className="h-4 w-4" />
                Iniciar Mapeamento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-6">
          {/* Left: Position Cards */}
          <div className="flex-1 grid gap-4 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 content-start">
            {Array.from(groupedSuccessions.entries()).map(([positionId, { position, successors }]) => {
              const existingRanks = successors.map(s => s.rank || 1);
              const canAddMore = existingRanks.length < 3;
              const isSelected = selectedPositionId === positionId;

              return (
                <Card 
                  key={positionId} 
                  className={`border-indigo-200/50 dark:border-indigo-800/30 cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? "ring-2 ring-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20" : ""
                  }`}
                  onClick={() => setSelectedPositionId(positionId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {position?.title || "Cargo não definido"}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {position?.code} • Grade {position?.grade}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {successors.length}/3
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {successors.map((succession) => (
                      <div 
                        key={succession.id}
                        className="p-3 bg-muted/30 rounded-lg border border-border/50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl" title={`${succession.rank}º lugar`}>
                              {rankIcons[succession.rank || 1]}
                            </span>
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={succession.successor?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {succession.successor?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {succession.successor?.full_name || "Sucessor não definido"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {succession.successor?.job_title} 
                                {succession.successor?.grade && ` • G${succession.successor.grade}`}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(succession)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(succession.id)} 
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className={`text-xs ${readinessColors[succession.readiness]}`}>
                            {readinessLabels[succession.readiness]}
                          </Badge>
                        </div>

                        {succession.development_plan && (
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                            📋 {succession.development_plan}
                          </p>
                        )}
                      </div>
                    ))}

                    {canAddMore && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToPosition(positionId, existingRanks);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar {existingRanks.length + 1}º Sucessor
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Right: Detail Panel */}
          {selectedPositionId && groupedSuccessions.has(selectedPositionId) && (
            <div className="hidden lg:block w-[400px] shrink-0">
              <KeyPositionDetailPanel
                positionId={selectedPositionId}
                successors={groupedSuccessions.get(selectedPositionId)!.successors}
              />
            </div>
          )}
        </div>
      )}

      {/* Dialog */}
      <SuccessionDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        succession={editingSuccession}
        preselectedPositionId={preselectedPositionId}
        preselectedRank={preselectedRank}
      />
    </div>
  );
}