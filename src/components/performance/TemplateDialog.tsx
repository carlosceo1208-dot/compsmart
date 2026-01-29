import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  usePerformanceTemplates, 
  templateTypeLabels, 
  type PerformanceTemplate, 
  type TemplateIndicator 
} from "@/hooks/usePerformanceTemplates";
import { Loader2, Plus, Trash2 } from "lucide-react";


interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: PerformanceTemplate | null;
}

export function TemplateDialog({ open, onOpenChange, template }: TemplateDialogProps) {
  const { createTemplate, updateTemplate, parseIndicators } = usePerformanceTemplates();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    template_type: "standard",
  });

  const [indicators, setIndicators] = useState<TemplateIndicator[]>([]);

  const isEditing = !!template;

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || "",
        template_type: template.template_type,
      });
      setIndicators(parseIndicators(template.indicators));
    } else {
      setFormData({
        name: "",
        description: "",
        template_type: "standard",
      });
      setIndicators([]);
    }
  }, [template]);

  const addIndicator = () => {
    setIndicators([
      ...indicators,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `ind-${Date.now()}`,
        name: "",
        description: "",
        weight: 0,
      },
    ]);
  };

  const updateIndicator = (index: number, field: keyof TemplateIndicator, value: string | number) => {
    const updated = [...indicators];
    updated[index] = { ...updated[index], [field]: value };
    setIndicators(updated);
  };

  const removeIndicator = (index: number) => {
    setIndicators(indicators.filter((_, i) => i !== index));
  };

  const totalWeight = indicators.reduce((sum, ind) => sum + (ind.weight || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const templateData = {
      name: formData.name,
      description: formData.description || null,
      template_type: formData.template_type,
      indicators: indicators as unknown as any,
    };

    if (isEditing && template) {
      await updateTemplate.mutateAsync({ id: template.id, ...templateData });
    } else {
      await createTemplate.mutateAsync(templateData);
    }

    onOpenChange(false);
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Modelo" : "Novo Modelo de Avaliação"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Avaliação Operacional"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.template_type}
                onValueChange={(value) => setFormData({ ...formData, template_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(templateTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o modelo de avaliação..."
              rows={2}
            />
          </div>

          {/* Indicators Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Indicadores de Avaliação</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIndicator}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {indicators.length === 0 ? (
              <div className="border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                Nenhum indicador adicionado. Clique em "Adicionar" para começar.
              </div>
            ) : (
              <div className="space-y-3">
                {indicators.map((indicator, index) => (
                  <div key={indicator.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <Input
                        placeholder="Nome do indicador"
                        value={indicator.name}
                        onChange={(e) => updateIndicator(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Peso"
                        value={indicator.weight || ""}
                        onChange={(e) => updateIndicator(index, "weight", parseFloat(e.target.value) || 0)}
                        className="w-20"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIndicator(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Descrição do indicador (opcional)"
                      value={indicator.description || ""}
                      onChange={(e) => updateIndicator(index, "description", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                ))}

                <div className="flex justify-end">
                  <span className={`text-sm font-medium ${totalWeight === 100 ? "text-green-600" : "text-amber-600"}`}>
                    Total: {totalWeight}% {totalWeight !== 100 && "(Ideal: 100%)"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Modelo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
