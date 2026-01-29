import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Plus, Search, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { usePerformanceSuccession, readinessLabels, readinessColors, type SuccessionWithRelations } from "@/hooks/usePerformanceSuccession";
import { SuccessionDialog } from "@/components/performance/SuccessionDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function PerformanceSuccession() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSuccession, setEditingSuccession] = useState<SuccessionWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReadiness, setFilterReadiness] = useState<string | null>(null);

  const { successions, isLoading, deleteSuccession } = usePerformanceSuccession();

  const filteredSuccessions = successions.filter((s) => {
    const matchesSearch = 
      (s.key_position?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (s.successor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesReadiness = !filterReadiness || s.readiness === filterReadiness;
    return matchesSearch && matchesReadiness;
  });

  const handleEdit = (succession: SuccessionWithRelations) => {
    setEditingSuccession(succession);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSuccession(null);
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
          onClick={() => setDialogOpen(true)}
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

      {/* Tabela */}
      {isLoading ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-muted-foreground">Carregando mapeamentos...</p>
          </CardContent>
        </Card>
      ) : filteredSuccessions.length === 0 ? (
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
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Iniciar Mapeamento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição-Chave</TableHead>
                <TableHead>Potencial Sucessor</TableHead>
                <TableHead>Prontidão</TableHead>
                <TableHead>Plano de Desenvolvimento</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuccessions.map((succession) => (
                <TableRow key={succession.id}>
                  <TableCell className="font-medium">
                    {succession.key_position?.title || "Cargo não definido"}
                  </TableCell>
                  <TableCell>
                    {succession.successor?.full_name || "Sucessor não definido"}
                  </TableCell>
                  <TableCell>
                    <Badge className={readinessColors[succession.readiness]}>
                      {readinessLabels[succession.readiness]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {succession.development_plan || "-"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialog */}
      <SuccessionDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        succession={editingSuccession}
      />
    </div>
  );
}
