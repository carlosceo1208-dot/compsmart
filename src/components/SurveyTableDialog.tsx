import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SurveyTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyTable?: {
    id: string;
    name: string;
    effective_month: number;
    effective_year: number;
    is_active: boolean;
    default_amplitude: number | null;
  };
  onSuccess: () => void;
}

export function SurveyTableDialog({
  open,
  onOpenChange,
  surveyTable,
  onSuccess,
}: SurveyTableDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [effectiveMonth, setEffectiveMonth] = useState("1");
  const [effectiveYear, setEffectiveYear] = useState(new Date().getFullYear().toString());
  const [isActive, setIsActive] = useState(false);
  const [defaultAmplitude, setDefaultAmplitude] = useState("");

  useEffect(() => {
    if (surveyTable) {
      setName(surveyTable.name);
      setEffectiveMonth(surveyTable.effective_month.toString());
      setEffectiveYear(surveyTable.effective_year.toString());
      setIsActive(surveyTable.is_active);
      setDefaultAmplitude(surveyTable.default_amplitude?.toString() || "");
    } else {
      setName("");
      setEffectiveMonth("1");
      setEffectiveYear(new Date().getFullYear().toString());
      setIsActive(false);
      setDefaultAmplitude("");
    }
  }, [surveyTable, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da pesquisa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const year = parseInt(effectiveYear);
    if (year < 2000 || year > 2100) {
      toast({
        title: "Erro",
        description: "Ano inválido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        effective_month: parseInt(effectiveMonth),
        effective_year: year,
        is_active: isActive,
        default_amplitude: defaultAmplitude ? parseFloat(defaultAmplitude) : null,
      };

      if (surveyTable) {
        const { error } = await supabase
          .from("survey_tables")
          .update(data)
          .eq("id", surveyTable.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Pesquisa atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("survey_tables")
          .insert(data);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Pesquisa criada com sucesso",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving survey table:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar pesquisa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {surveyTable ? "Editar Pesquisa" : "Nova Pesquisa Salarial"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Pesquisa</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pesquisa Agronegócio 2024"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Mês de Vigência</Label>
              <Select value={effectiveMonth} onValueChange={setEffectiveMonth}>
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                  ].map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Ano de Vigência</Label>
              <Input
                id="year"
                type="number"
                value={effectiveYear}
                onChange={(e) => setEffectiveYear(e.target.value)}
                min="2000"
                max="2100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amplitude">Amplitude Padrão (%)</Label>
            <Input
              id="amplitude"
              type="number"
              value={defaultAmplitude}
              onChange={(e) => setDefaultAmplitude(e.target.value)}
              placeholder="Ex: 45 (opcional)"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Será sugerida ao adicionar novos cargos no modo automático
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Marcar como ativa</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
