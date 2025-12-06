import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2 } from "lucide-react";

interface CopySurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceSurvey: {
    id: string;
    name: string;
    effective_month: number;
    effective_year: number;
  } | null;
  onSuccess: (newSurveyId: string) => void;
}

export function CopySurveyDialog({
  open,
  onOpenChange,
  sourceSurvey,
  onSuccess,
}: CopySurveyDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [effectiveMonth, setEffectiveMonth] = useState("1");
  const [effectiveYear, setEffectiveYear] = useState(new Date().getFullYear().toString());
  const [isActive, setIsActive] = useState(false);

  // Reset form when dialog opens with new source
  useState(() => {
    if (sourceSurvey && open) {
      setName(`Cópia - ${sourceSurvey.name}`);
      setEffectiveMonth(sourceSurvey.effective_month.toString());
      setEffectiveYear(sourceSurvey.effective_year.toString());
      setIsActive(false);
    }
  });

  const handleSubmit = async () => {
    if (!sourceSurvey) return;

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
      // Get user's root_company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("root_company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.root_company_id) {
        throw new Error("Empresa do usuário não encontrada");
      }

      // Create new survey table with user's company
      const { data: newSurvey, error: createError } = await supabase
        .from("survey_tables")
        .insert({
          name: name.trim(),
          effective_month: parseInt(effectiveMonth),
          effective_year: year,
          is_active: isActive,
          root_company_id: profile.root_company_id,
        })
        .select("id")
        .single();

      if (createError) throw createError;

      // Copy all survey data from source to new survey
      const { data: sourceData, error: fetchError } = await supabase
        .from("survey_data")
        .select("job_code, job_title, grade, calculation_mode, input_median, input_amplitude, min_value, q1_value, median_value, q3_value, max_value")
        .eq("survey_table_id", sourceSurvey.id);

      if (fetchError) throw fetchError;

      if (sourceData && sourceData.length > 0) {
        const dataToInsert = sourceData.map(item => ({
          ...item,
          survey_table_id: newSurvey.id,
        }));

        const { error: insertError } = await supabase
          .from("survey_data")
          .insert(dataToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso",
        description: `Pesquisa copiada com ${sourceData?.length || 0} cargos`,
      });

      onSuccess(newSurvey.id);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error copying survey:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao copiar pesquisa",
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
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Copiar Pesquisa para Minha Empresa
          </DialogTitle>
          <DialogDescription>
            Crie uma cópia editável desta pesquisa CompSmart para sua empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">Pesquisa origem:</p>
            <p className="text-muted-foreground">{sourceSurvey?.name}</p>
          </div>

          <div>
            <Label htmlFor="name">Nome da Nova Pesquisa</Label>
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
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Copiando...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Pesquisa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
