import { useState, useCallback } from "react";
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
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedPDF {
  fileName: string;
  fileSize: string;
  text: string;
  suggestedTitle: string;
  suggestedKeywords: string[];
}

const extractKeywords = (text: string): string[] => {
  const stopwords = new Set([
    'o', 'a', 'de', 'da', 'do', 'dos', 'das', 'em', 'para',
    'com', 'por', 'no', 'na', 'nos', 'nas', 'ao', 'aos',
    'um', 'uma', 'é', 'são', 'foi', 'será', 'mais', 'como',
    'que', 'os', 'as', 'se', 'pelo', 'pela', 'pelos', 'pelas'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\sáàâãéèêíïóôõöúçñ]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4 && !stopwords.has(w));

  const freq = words.reduce((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
};

export function DocumentUploadDialog({ open, onOpenChange, onSuccess }: DocumentUploadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedPDF, setParsedPDF] = useState<ParsedPDF | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    agent_type: 'legal',
    category: '',
    subcategory: '',
    keywords: [] as string[],
    is_global: false
  });

  const parsePDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText;
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Apenas arquivos PDF são suportados");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error("Arquivo muito grande. Máximo 10MB");
      return;
    }

    setParsing(true);
    try {
      const text = await parsePDF(file);
      const keywords = extractKeywords(text);
      const title = file.name.replace('.pdf', '');

      setParsedPDF({
        fileName: file.name,
        fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        text: text,
        suggestedTitle: title,
        suggestedKeywords: keywords
      });

      setFormData(prev => ({
        ...prev,
        title: title,
        keywords: keywords
      }));

      toast.success("PDF processado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao processar PDF:", error);
      toast.error("Erro ao processar PDF: " + error.message);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleSave = async () => {
    if (!parsedPDF) {
      toast.error("Nenhum PDF foi carregado");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!formData.category.trim()) {
      toast.error("Categoria é obrigatória");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      const { error } = await supabase
        .from('knowledge_base')
        .insert({
          title: formData.title.trim(),
          agent_type: formData.agent_type,
          category: formData.category.trim(),
          subcategory: formData.subcategory.trim() || null,
          content: parsedPDF.text,
          keywords: formData.keywords,
          is_global: formData.is_global,
          root_company_id: profile.root_company_id,
          source_document: parsedPDF.fileName,
          is_active: true,
          created_by: user.id
        });

      if (error) throw error;

      toast.success("Documento importado com sucesso!");
      onSuccess();
      onOpenChange(false);
      setParsedPDF(null);
      setFormData({
        title: '',
        agent_type: 'legal',
        category: '',
        subcategory: '',
        keywords: [],
        is_global: false
      });
    } catch (error: any) {
      console.error("Erro ao salvar documento:", error);
      toast.error(error.message || "Erro ao salvar documento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setParsedPDF(null);
        setFormData({
          title: '',
          agent_type: 'legal',
          category: '',
          subcategory: '',
          keywords: [],
          is_global: false
        });
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Documento PDF</DialogTitle>
          <DialogDescription>
            Faça upload de um PDF e o sistema extrairá automaticamente o conteúdo e keywords
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload Area */}
          {!parsedPDF && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
                disabled={parsing}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                {parsing ? (
                  <>
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-lg font-medium mb-2">Processando documento...</p>
                    <p className="text-sm text-muted-foreground">
                      Extraindo texto, analisando estrutura e detectando keywords automaticamente
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Arraste um PDF aqui</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Máximo: 10MB
                    </p>
                  </>
                )}
              </label>
            </div>
          )}

          {/* Parsed PDF Info & Form */}
          {parsedPDF && (
            <>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">{parsedPDF.fileName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {parsedPDF.fileSize} • {parsedPDF.text.length.toLocaleString()} caracteres extraídos
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Agente e Categoria */}
                <div className="grid grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Leis, Políticas"
                    />
                  </div>
                </div>

                {/* Subcategoria */}
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategoria</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  />
                </div>

                {/* Preview do Conteúdo */}
                <div className="space-y-2">
                  <Label>Preview do Conteúdo Extraído</Label>
                  <Textarea
                    value={parsedPDF.text.substring(0, 500) + '...'}
                    readOnly
                    className="min-h-[150px] font-mono text-xs"
                  />
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <Label>Keywords Detectadas</Label>
                  <KeywordsInput
                    keywords={formData.keywords}
                    onChange={(keywords) => setFormData({ ...formData, keywords })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keywords foram detectadas automaticamente. Você pode adicionar ou remover.
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
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || parsing}>
            Cancelar
          </Button>
          {parsedPDF && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Importar Documento'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
