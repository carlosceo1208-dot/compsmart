import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SurveyTableSelector } from "@/components/SurveyTableSelector";
import { SurveyTableDialog } from "@/components/SurveyTableDialog";
import { SurveyDataDialog } from "@/components/SurveyDataDialog";
import { SurveyBulkImport } from "@/components/SurveyBulkImport";
import { Settings, Plus, Upload, Pencil } from "lucide-react";

interface SurveyData {
  id: string;
  job_code: string;
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
}

interface SurveyTable {
  id: string;
  name: string;
  default_amplitude: number | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function SurveyDataPage() {
  const { toast } = useToast();
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>();
  const [selectedTable, setSelectedTable] = useState<SurveyTable | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editingData, setEditingData] = useState<SurveyData | undefined>();

  useEffect(() => {
    if (selectedTableId) {
      fetchSurveyData();
      fetchSelectedTable();
    }
  }, [selectedTableId]);

  const fetchSelectedTable = async () => {
    if (!selectedTableId) return;

    try {
      const { data, error } = await supabase
        .from("survey_tables")
        .select("id, name, default_amplitude")
        .eq("id", selectedTableId)
        .single();

      if (error) throw error;
      setSelectedTable(data);
    } catch (error) {
      console.error("Error fetching selected table:", error);
    }
  };

  const fetchSurveyData = async () => {
    if (!selectedTableId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("survey_data")
        .select("*")
        .eq("survey_table_id", selectedTableId)
        .order("grade");

      if (error) throw error;
      setSurveyData(data || []);
    } catch (error: any) {
      console.error("Error fetching survey data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da pesquisa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (data: SurveyData) => {
    setEditingData(data);
    setDataDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingData(undefined);
    setDataDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pesquisa Salarial</h1>
        <p className="text-muted-foreground mt-2">
          Importe e gerencie dados de pesquisas salariais de mercado
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setTableDialogOpen(true)} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Gerenciar Pesquisas
        </Button>
        {selectedTableId && (
          <>
            <Button onClick={() => setBulkImportOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar em Massa
            </Button>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cargo
            </Button>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pesquisa Selecionada</CardTitle>
          <CardDescription>
            Selecione uma pesquisa salarial para visualizar e gerenciar seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SurveyTableSelector
            value={selectedTableId}
            onChange={setSelectedTableId}
          />
        </CardContent>
      </Card>

      {selectedTableId && (
        <Card>
          <CardHeader>
            <CardTitle>Cargos da Pesquisa</CardTitle>
            <CardDescription>
              {surveyData.length} cargo(s) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : surveyData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhum cargo cadastrado nesta pesquisa
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Cargo
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título do Cargo</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                      <TableHead className="text-right">1º Quartil</TableHead>
                      <TableHead className="text-right">Média</TableHead>
                      <TableHead className="text-right">3º Quartil</TableHead>
                      <TableHead className="text-right">Máximo</TableHead>
                      <TableHead>Modo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surveyData.map((data) => (
                      <TableRow key={data.id}>
                        <TableCell className="font-mono text-xs">{data.job_code}</TableCell>
                        <TableCell>{data.job_title}</TableCell>
                        <TableCell className="font-semibold">{data.grade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.min_value)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.q1_value)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(data.median_value)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.q3_value)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.max_value)}</TableCell>
                        <TableCell>
                          <Badge variant={data.calculation_mode === "automatic" ? "default" : "secondary"}>
                            {data.calculation_mode === "automatic" ? "Auto" : "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(data)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <SurveyTableDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        onSuccess={() => {
          fetchSurveyData();
          fetchSelectedTable();
        }}
      />

      {selectedTableId && (
        <>
          <SurveyDataDialog
            open={dataDialogOpen}
            onOpenChange={setDataDialogOpen}
            surveyTableId={selectedTableId}
            defaultAmplitude={selectedTable?.default_amplitude}
            surveyData={editingData}
            onSuccess={fetchSurveyData}
          />

          <SurveyBulkImport
            open={bulkImportOpen}
            onOpenChange={setBulkImportOpen}
            surveyTableId={selectedTableId}
            onSuccess={fetchSurveyData}
          />
        </>
      )}
    </div>
  );
}
