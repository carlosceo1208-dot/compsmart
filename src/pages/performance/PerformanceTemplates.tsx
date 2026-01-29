import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Loader2 } from "lucide-react";
import { usePerformanceTemplates, templateTypeLabels, type PerformanceTemplate } from "@/hooks/usePerformanceTemplates";
import { TemplateDialog } from "@/components/performance/TemplateDialog";
import { TemplateCard } from "@/components/performance/TemplateCard";

export default function PerformanceTemplates() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PerformanceTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const { templates, isLoading } = usePerformanceTemplates({ includeGlobal: true });

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = !filterType || template.template_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleEdit = (template: PerformanceTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
  };

  const typeOptions = Object.entries(templateTypeLabels);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Modelos de Avaliação
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure modelos para diferentes tipos de cargos
          </p>
        </div>
        <Button 
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Novo Modelo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar modelos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={filterType === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterType(null)}
          >
            Todos
          </Badge>
          {typeOptions.map(([key, label]) => (
            <Badge
              key={key}
              variant={filterType === key ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterType(key)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Lista de Templates */}
      {isLoading ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm text-muted-foreground">Carregando modelos...</p>
          </CardContent>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-indigo-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || filterType ? "Nenhum modelo encontrado" : "Nenhum modelo cadastrado"}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {searchTerm || filterType 
                ? "Tente ajustar os filtros de busca"
                : "Crie modelos para Operacional, Administrativo, Técnico, Vendas e Gestores"
              }
            </p>
            {!searchTerm && !filterType && (
              <Button 
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Criar Modelo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => handleEdit(template)}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <TemplateDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        template={editingTemplate}
      />
    </div>
  );
}
