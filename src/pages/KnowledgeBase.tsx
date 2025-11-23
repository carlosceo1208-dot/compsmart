import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FilterSidebar } from "@/components/knowledge/FilterSidebar";
import { DocumentCard } from "@/components/knowledge/DocumentCard";
import { DocumentDialog } from "@/components/knowledge/DocumentDialog";
import { DocumentUploadDialog } from "@/components/knowledge/DocumentUploadDialog";
import { DocumentPreviewDialog } from "@/components/knowledge/DocumentPreviewDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import {
  BookOpen,
  Plus,
  Upload,
  Search,
  FileText,
  Scale,
  TrendingUp,
  Loader2,
  FileQuestion
} from "lucide-react";

type KnowledgeDocument = Tables<"knowledge_base">;

interface KnowledgeFilters {
  search: string;
  agent_types: string[];
  categories: string[];
  is_global: boolean[];
  is_active: boolean[];
}

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<KnowledgeFilters>({
    search: '',
    agent_types: [],
    categories: [],
    is_global: [],
    is_active: []
  });
  const [stats, setStats] = useState({ total: 0, legal: 0, incentive: 0 });
  
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<KnowledgeDocument | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('knowledge_base')
        .select('*');

      // Filtros
      if (filters.agent_types.length > 0 && filters.agent_types.length < 3) {
        query = query.in('agent_type', filters.agent_types);
      }

      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      if (filters.is_global.length > 0 && filters.is_global.length < 2) {
        query = query.in('is_global', filters.is_global);
      }

      if (filters.is_active.length > 0 && filters.is_active.length < 2) {
        query = query.in('is_active', filters.is_active);
      }

      if (filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,keywords.cs.{${searchTerm}}`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setDocuments(data || []);

      // Calcular estatísticas
      const total = data?.length || 0;
      const legal = data?.filter(d => d.agent_type === 'legal' || d.agent_type === 'both').length || 0;
      const incentive = data?.filter(d => d.agent_type === 'incentive' || d.agent_type === 'both').length || 0;
      setStats({ total, legal, incentive });
    } catch (error: any) {
      console.error("Erro ao buscar documentos:", error);
      toast.error("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('knowledge_base')
        .select('category')
        .not('category', 'is', null);

      const uniqueCategories = [...new Set(data?.map(d => d.category) || [])];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchCategories();
  }, [filters]);

  const handleEdit = (doc: KnowledgeDocument) => {
    setSelectedDocument(doc);
    setShowCreateDialog(true);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', documentToDelete.id);

      if (error) throw error;

      toast.success("Documento deletado com sucesso!");
      fetchDocuments();
    } catch (error: any) {
      console.error("Erro ao deletar documento:", error);
      toast.error("Erro ao deletar documento");
    } finally {
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    }
  };

  const handleToggleActive = async (doc: KnowledgeDocument) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ is_active: !doc.is_active })
        .eq('id', doc.id);

      if (error) throw error;

      toast.success(`Documento ${!doc.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      fetchDocuments();
    } catch (error: any) {
      console.error("Erro ao atualizar documento:", error);
      toast.error("Erro ao atualizar documento");
    }
  };

  const handlePreview = (doc: KnowledgeDocument) => {
    setSelectedDocument(doc);
    setShowPreviewDialog(true);
  };

  const hasActiveFilters = 
    filters.agent_types.length > 0 ||
    filters.categories.length > 0 ||
    filters.is_global.length > 0 ||
    filters.is_active.length > 0 ||
    filters.search.trim() !== '';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            Base de Conhecimento
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie documentos de referência para os Agentes Smart
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
          <Button onClick={() => {
            setSelectedDocument(null);
            setShowCreateDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Documento
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total de Documentos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Scale className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.legal}</p>
              <p className="text-xs text-muted-foreground">Documentos Jurídicos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.incentive}</p>
              <p className="text-xs text-muted-foreground">Documentos R&B</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, conteúdo ou keywords..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Content */}
      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* Filters Sidebar */}
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
        />

        {/* Documents Grid */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <Card className="p-12 text-center">
              <FileQuestion className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Tente ajustar os filtros ou buscar por outros termos"
                  : "Comece criando um novo documento ou fazendo upload de um PDF"
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Documento
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {documents.map(doc => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onEdit={() => handleEdit(doc)}
                  onDelete={() => {
                    setDocumentToDelete(doc);
                    setShowDeleteDialog(true);
                  }}
                  onToggleActive={() => handleToggleActive(doc)}
                  onPreview={() => handlePreview(doc)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <DocumentDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedDocument(null);
        }}
        document={selectedDocument}
        onSave={() => {
          fetchDocuments();
          fetchCategories();
        }}
      />

      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={() => {
          fetchDocuments();
          fetchCategories();
        }}
      />

      <DocumentPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        document={selectedDocument}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar "{documentToDelete?.title}"?
              Esta ação não pode ser desfeita e o documento ficará indisponível para os Agentes Smart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KnowledgeBase;
