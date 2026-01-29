import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Plus, Search, Loader2 } from "lucide-react";
import { usePerformancePDI, pdiStatusLabels, pdiStatusColors, type PDIWithRelations } from "@/hooks/usePerformancePDI";
import { PDIDialog } from "@/components/performance/PDIDialog";
import { PDICard } from "@/components/performance/PDICard";

export default function PerformancePDI() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPDI, setEditingPDI] = useState<PDIWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const { pdis, isLoading } = usePerformancePDI();

  const filteredPDIs = pdis.filter((pdi) => {
    const matchesSearch = pdi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pdi.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = !filterStatus || pdi.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (pdi: PDIWithRelations) => {
    setEditingPDI(pdi);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPDI(null);
  };

  const statusOptions = Object.entries(pdiStatusLabels);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Planos de Desenvolvimento Individual (PDI)
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o desenvolvimento dos colaboradores
          </p>
        </div>
        <Button 
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Novo PDI
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar PDIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={filterStatus === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterStatus(null)}
          >
            Todos
          </Badge>
          {statusOptions.map(([key, label]) => (
            <Badge
              key={key}
              variant={filterStatus === key ? "default" : "outline"}
              className={`cursor-pointer ${filterStatus === key ? pdiStatusColors[key] : ""}`}
              onClick={() => setFilterStatus(key)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Lista de PDIs */}
      {isLoading ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-muted-foreground">Carregando PDIs...</p>
          </CardContent>
        </Card>
      ) : filteredPDIs.length === 0 ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="h-16 w-16 text-indigo-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || filterStatus ? "Nenhum PDI encontrado" : "Nenhum PDI cadastrado"}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {searchTerm || filterStatus 
                ? "Tente ajustar os filtros de busca"
                : "PDIs são criados automaticamente após avaliações ou manualmente"
              }
            </p>
            {!searchTerm && !filterStatus && (
              <Button 
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Criar PDI
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPDIs.map((pdi) => (
            <PDICard
              key={pdi.id}
              pdi={pdi}
              onEdit={() => handleEdit(pdi)}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <PDIDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        pdi={editingPDI}
      />
    </div>
  );
}
