import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SurveyDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyTableId: string;
  defaultAmplitude?: number | null;
  surveyData?: {
    id: string;
    job_code: string | null;
    job_title: string;
    grade: string;
    calculation_mode: string;
    input_median: number | null;
    input_amplitude: number | null;
    min_value: number;
    q1_value: number;
    median_value: number;
    q3_value: number;
    max_value: number;
  };
  onSuccess: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function SurveyDataDialog({
  open,
  onOpenChange,
  surveyTableId,
  defaultAmplitude,
  surveyData,
  onSuccess,
}: SurveyDataDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"manual" | "automatic">("manual");

  // Basic fields
  const [jobCode, setJobCode] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [grade, setGrade] = useState("");

  // Manual mode
  const [minValue, setMinValue] = useState("");
  const [q1Value, setQ1Value] = useState("");
  const [medianValue, setMedianValue] = useState("");
  const [q3Value, setQ3Value] = useState("");
  const [maxValue, setMaxValue] = useState("");

  // Automatic mode
  const [inputMedian, setInputMedian] = useState("");
  const [inputAmplitude, setInputAmplitude] = useState("");
  const [calculatedValues, setCalculatedValues] = useState<{
    min_value: number;
    q1_value: number;
    median_value: number;
    q3_value: number;
    max_value: number;
  } | null>(null);

  useEffect(() => {
    if (surveyData) {
      setJobCode(surveyData.job_code || "");
      setJobTitle(surveyData.job_title);
      setGrade(surveyData.grade);
      setMode(surveyData.calculation_mode as "manual" | "automatic");

      if (surveyData.calculation_mode === "manual") {
        setMinValue(surveyData.min_value.toString());
        setQ1Value(surveyData.q1_value.toString());
        setMedianValue(surveyData.median_value.toString());
        setQ3Value(surveyData.q3_value.toString());
        setMaxValue(surveyData.max_value.toString());
      } else {
        setInputMedian(surveyData.input_median?.toString() || "");
        setInputAmplitude(surveyData.input_amplitude?.toString() || "");
        setCalculatedValues({
          min_value: surveyData.min_value,
          q1_value: surveyData.q1_value,
          median_value: surveyData.median_value,
          q3_value: surveyData.q3_value,
          max_value: surveyData.max_value,
        });
      }
    } else {
      // Reset for new entry
      setJobCode("");
      setJobTitle("");
      setGrade("");
      setMode("manual");
      setMinValue("");
      setQ1Value("");
      setMedianValue("");
      setQ3Value("");
      setMaxValue("");
      setInputMedian("");
      setInputAmplitude(defaultAmplitude?.toString() || "");
      setCalculatedValues(null);
    }
  }, [surveyData, open, defaultAmplitude]);

  const handleCalculate = async () => {
    if (!inputMedian || !inputAmplitude) {
      toast({
        title: "Erro",
        description: "Informe o ponto médio e a amplitude",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("calculate_salary_range", {
        p_median: parseFloat(inputMedian),
        p_amplitude: parseFloat(inputAmplitude),
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setCalculatedValues(data[0]);
      }
    } catch (error: any) {
      console.error("Error calculating range:", error);
      toast({
        title: "Erro",
        description: "Erro ao calcular faixa salarial",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!jobTitle.trim() || !grade.trim()) {
      toast({
        title: "Erro",
        description: "Preencha título e grade (código é opcional)",
        variant: "destructive",
      });
      return;
    }

    let dataToSave: any = {
      survey_table_id: surveyTableId,
      job_code: jobCode.trim() || null,
      job_title: jobTitle.trim(),
      grade: grade.trim(),
      calculation_mode: mode,
    };

    if (mode === "manual") {
      if (!minValue || !q1Value || !medianValue || !q3Value || !maxValue) {
        toast({
          title: "Erro",
          description: "Preencha todos os valores da faixa salarial",
          variant: "destructive",
        });
        return;
      }

      dataToSave = {
        ...dataToSave,
        min_value: parseFloat(minValue),
        q1_value: parseFloat(q1Value),
        median_value: parseFloat(medianValue),
        q3_value: parseFloat(q3Value),
        max_value: parseFloat(maxValue),
        input_median: null,
        input_amplitude: null,
      };
    } else {
      if (!calculatedValues) {
        toast({
          title: "Erro",
          description: "Calcule a faixa salarial antes de salvar",
          variant: "destructive",
        });
        return;
      }

      dataToSave = {
        ...dataToSave,
        input_median: parseFloat(inputMedian),
        input_amplitude: parseFloat(inputAmplitude),
        ...calculatedValues,
      };
    }

    setLoading(true);
    try {
      if (surveyData) {
        const { error } = await supabase
          .from("survey_data")
          .update(dataToSave)
          .eq("id", surveyData.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Cargo atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("survey_data")
          .insert(dataToSave);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Cargo adicionado com sucesso",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving survey data:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar cargo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {surveyData ? "Editar Cargo" : "Adicionar Cargo à Pesquisa"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="code">
                Código do Cargo <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input
                id="code"
                value={jobCode}
                onChange={(e) => setJobCode(e.target.value)}
                placeholder="Ex: ANA-01 (deixe vazio se não disponível)"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="title">Título do Cargo</Label>
              <Input
                id="title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex: Analista Agrícola"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="grade">Grade/Nível</Label>
            <Input
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Ex: 3"
            />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "automatic")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
              <TabsTrigger value="automatic">Cálculo Automático</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="min">Mínimo</Label>
                  <Input
                    id="min"
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="q1">1º Quartil</Label>
                  <Input
                    id="q1"
                    type="number"
                    value={q1Value}
                    onChange={(e) => setQ1Value(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="median">Média</Label>
                  <Input
                    id="median"
                    type="number"
                    value={medianValue}
                    onChange={(e) => setMedianValue(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="q3">3º Quartil</Label>
                  <Input
                    id="q3"
                    type="number"
                    value={q3Value}
                    onChange={(e) => setQ3Value(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="max">Máximo</Label>
                  <Input
                    id="max"
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="automatic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inputMedian">Ponto Médio (R$)</Label>
                  <Input
                    id="inputMedian"
                    type="number"
                    value={inputMedian}
                    onChange={(e) => setInputMedian(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="inputAmplitude">Amplitude (%)</Label>
                  <Input
                    id="inputAmplitude"
                    type="number"
                    value={inputAmplitude}
                    onChange={(e) => setInputAmplitude(e.target.value)}
                    placeholder="45.00"
                    step="0.01"
                  />
                </div>
              </div>

              <Button onClick={handleCalculate} disabled={loading} className="w-full">
                {loading ? "Calculando..." : "Calcular Automaticamente"}
              </Button>

              {calculatedValues && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-5 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Mínimo</p>
                        <p className="font-semibold">{formatCurrency(calculatedValues.min_value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">1º Quartil</p>
                        <p className="font-semibold">{formatCurrency(calculatedValues.q1_value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Média</p>
                        <p className="font-semibold">{formatCurrency(calculatedValues.median_value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">3º Quartil</p>
                        <p className="font-semibold">{formatCurrency(calculatedValues.q3_value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Máximo</p>
                        <p className="font-semibold">{formatCurrency(calculatedValues.max_value)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
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
