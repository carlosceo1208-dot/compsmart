import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { KeywordsInput } from "./KeywordsInput";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type KnowledgeDocument = Tables<"knowledge_base">;

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: KnowledgeDocument | null;
  onSave: () => void;
}

interface FormData {
  title: string;
  agent_type: string;
  category: string;
  subcategory: string;
  content: string;
  keywords: string[];
  is_global: boolean;
}

export function DocumentDialog({ open, onOpenChange, document, onSave }: DocumentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    agent_type: 'legal',
    category: '',
    subcategory: '',
    content: '',
    keywords: [],
    is_global: false
  });

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title,
        agent_type: document.agent_type,
        category: document.category,
        subcategory: document.subcategory || '',
        content: document.content,
        keywords: document.keywords || [],
        is_global: document.is_global || false
      });
    } else {
      setFormData({
        title: '',
        agent_type: 'legal',
        category: '',
        subcategory: '',
        content: '',
        keywords: [],
        is_global: false
      });
    }
  }, [document, open]);

  const handleSave = async () => {
    // Validações
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!formData.category.trim()) {
      toast.error("Categoria é obrigatória");
      return;
    }
    if (formData.content.trim().length < 50) {
      toast.error("Conteúdo deve ter no mínimo 50 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Buscar root_company_id do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      const dataToSave = {
        title: formData.title.trim(),
        agent_type: formData.agent_type,
        category: formData.category.trim(),
        subcategory: formData.subcategory.trim() || null,
        content: formData.content.trim(),
        keywords: formData.keywords,
        is_global: formData.is_global,
        root_company_id: profile.root_company_id,
        is_active: true
      };

      if (document) {
        // Update
        const { error } = await supabase
          .from('knowledge_base')
          .update(dataToSave)
          .eq('id', document.id);

        if (error) throw error;
        toast.success("Documento atualizado com sucesso!");
      } else {
        // Create
        const { error } = await supabase
          .from('knowledge_base')
          .insert({
            ...dataToSave,
            created_by: user.id
          });

        if (error) throw error;
        toast.success("Documento criado com sucesso!");
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar documento:", error);
      toast.error(error.message || "Erro ao salvar documento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {document ? 'Editar Documento' : 'Novo Documento'}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do documento para a base de conhecimento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: CLT - Artigos sobre Jornada de Trabalho"
            />
          </div>

          {/* Agente */}
          <div className="space-y-2">
            <Label htmlFor="agent_type">Tipo de Agente *</Label>
            <Select
              value={formData.agent_type}
              onValueChange={(value) => setFormData({ ...formData, agent_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="legal">Jurídico</SelectItem>
                <SelectItem value="incentive">Remuneração & Benefícios</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoria e Subcategoria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Leis, Políticas, Metodologias"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoria</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                placeholder="Ex: Trabalhista, CLT"
              />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo (suporta Markdown) *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Digite o conteúdo do documento..."
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 50 caracteres • Você pode usar formatação Markdown
            </p>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Keywords</Label>
            <KeywordsInput
              keywords={formData.keywords}
              onChange={(keywords) => setFormData({ ...formData, keywords })}
            />
            <p className="text-xs text-muted-foreground">
              Digite palavras-chave e pressione Enter ou vírgula para adicionar
            </p>
          </div>

          {/* Visibilidade Global */}
          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is_global" className="text-base">
                Visibilidade Global
              </Label>
              <p className="text-sm text-muted-foreground">
                Tornar este documento visível para todas as empresas
              </p>
            </div>
            <Switch
              id="is_global"
              checked={formData.is_global}
              onCheckedChange={(checked) => setFormData({ ...formData, is_global: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : document ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
