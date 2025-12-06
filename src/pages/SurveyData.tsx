import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { SurveyTableSelector } from "@/components/SurveyTableSelector";
import { SurveyTableDialog } from "@/components/SurveyTableDialog";
import { SurveyDataDialog } from "@/components/SurveyDataDialog";
import { SurveyBulkImport } from "@/components/SurveyBulkImport";
import { CopySurveyDialog } from "@/components/CopySurveyDialog";
import { Settings, Plus, Upload, Pencil, ArrowUp, ArrowDown, ChevronDown, Edit, Copy, Eye, Building2, FolderOpen, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  effective_month: number;
  effective_year: number;
  is_active: boolean;
  default_amplitude: number | null;
  root_company_id: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function SurveyDataPage() {
  const { toast } = useToast();
  const { data: userRole } = useCurrentUserRole();
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>();
  const [selectedTable, setSelectedTable] = useState<SurveyTable | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<SurveyData | undefined>();
  const [editingTable, setEditingTable] = useState<SurveyTable | null>(null);
  const [tableDialogMode, setTableDialogMode] = useState<"create" | "edit">("create");
  
  // Ordenação
  type SortField = "job_title" | "grade" | null;
  type SortDirection = "asc" | "desc" | null;
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Detectar se é template CompSmart
  const isTemplate = selectedTable?.root_company_id === null;
  const canEditTemplate = userRole?.isSuperAdmin;
  const canEditCurrentSurvey = !isTemplate || canEditTemplate;

  const normalizeGrade = (grade: string): string => {
    const cleaned = grade.trim().toUpperCase();
    const numericMatch = cleaned.match(/^0*(\d+)$/);
    if (numericMatch) return numericMatch[1];
    const alphanumericMatch = cleaned.match(/^([A-Z]+)0*(\d+)$/);
    if (alphanumericMatch) return `${alphanumericMatch[1]}${alphanumericMatch[2]}`;
    return cleaned;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...surveyData].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    
    let aVal = sortField === "job_title" ? a.job_title : normalizeGrade(a.grade);
    let bVal = sortField === "job_title" ? b.job_title : normalizeGrade(b.grade);
    
    if (sortField === "grade") {
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }
    }
    
    return sortDirection === "asc" 
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });

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
        .select("id, name, effective_month, effective_year, is_active, default_amplitude, root_company_id")
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
    if (!canEditCurrentSurvey) {
      toast({
        title: "Ação não permitida",
        description: "Copie esta pesquisa para sua empresa para poder editá-la",
        variant: "destructive",
      });
      return;
    }
    setEditingData(data);
    setDataDialogOpen(true);
  };

  const handleAddNew = () => {
    if (!canEditCurrentSurvey) {
      toast({
        title: "Ação não permitida",
        description: "Copie esta pesquisa para sua empresa para poder editá-la",
        variant: "destructive",
      });
      return;
    }
    setEditingData(undefined);
    setDataDialogOpen(true);
  };

  const handleTableChange = (table: SurveyTable | null) => {
    setSelectedTable(table);
  };

  const handleCopySuccess = (newSurveyId: string) => {
    setSelectedTableId(newSurveyId);
    // Refresh the selector
    window.location.reload();
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Gerenciar Pesquisas
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {/* Minhas Pesquisas Section */}
            <DropdownMenuLabel className="flex items-center gap-2 text-primary">
              <FolderOpen className="h-4 w-4" />
              MINHAS PESQUISAS
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {
              setTableDialogMode("create");
              setEditingTable(null);
              setTableDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Pesquisa
            </DropdownMenuItem>
            {selectedTable && !isTemplate && (
              <DropdownMenuItem 
                onClick={() => {
                  setTableDialogMode("edit");
                  setEditingTable(selectedTable);
                  setTableDialogOpen(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Pesquisa Atual
              </DropdownMenuItem>
            )}

            {/* CompSmart Templates Section */}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Building2 className="h-4 w-4" />
              PESQUISAS COMPSMART
            </DropdownMenuLabel>
            {isTemplate && (
              <>
                <DropdownMenuItem onClick={() => setCopyDialogOpen(true)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar para Minha Empresa
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setTableDialogMode("edit");
                    setEditingTable(selectedTable);
                    setTableDialogOpen(true);
                  }}
                  disabled={!canEditTemplate}
                >
                  {canEditTemplate ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Template
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </>
                  )}
                </DropdownMenuItem>
              </>
            )}

            {/* Super Admin only: Create Template */}
            {userRole?.isSuperAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setTableDialogMode("create");
                  setEditingTable(null);
                  setTableDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2 text-amber-600" />
                  <span className="text-amber-600 dark:text-amber-400">Novo Template CompSmart</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedTableId && canEditCurrentSurvey && (
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

        {selectedTableId && isTemplate && !canEditTemplate && (
          <Button onClick={() => setCopyDialogOpen(true)} variant="default">
            <Copy className="h-4 w-4 mr-2" />
            Copiar para Minha Empresa
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pesquisa Selecionada
            {isTemplate && (
              <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
                <Building2 className="h-3 w-3 mr-1" />
                Template CompSmart
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Selecione uma pesquisa salarial para visualizar e gerenciar seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SurveyTableSelector
            value={selectedTableId}
            onChange={setSelectedTableId}
            onTableChange={handleTableChange}
          />
        </CardContent>
      </Card>

      {/* Alert for template */}
      {isTemplate && !canEditTemplate && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Esta é uma pesquisa template CompSmart. Para editá-la, copie para sua empresa usando o botão acima.
          </AlertDescription>
        </Alert>
      )}

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
                {canEditCurrentSurvey && (
                  <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Cargo
                  </Button>
                )}
              </div>
            ) : (
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Código</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/70 select-none"
                        onClick={() => handleSort("job_title")}
                      >
                        <div className="flex items-center gap-2">
                          Título do Cargo
                          {sortField === "job_title" && (
                            sortDirection === "asc" ? 
                            <ArrowUp className="w-4 h-4" /> : 
                            <ArrowDown className="w-4 h-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/70 select-none"
                        onClick={() => handleSort("grade")}
                      >
                        <div className="flex items-center gap-2">
                          Grade
                          {sortField === "grade" && (
                            sortDirection === "asc" ? 
                            <ArrowUp className="w-4 h-4" /> : 
                            <ArrowDown className="w-4 h-4" />
                          )}
                        </div>
                      </TableHead>
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
                    {sortedData.map((data) => (
                      <TableRow key={data.id} className="hover:bg-primary/5 transition-colors">
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
                            disabled={!canEditCurrentSurvey}
                            title={!canEditCurrentSurvey ? "Copie para sua empresa para editar" : "Editar"}
                          >
                            {canEditCurrentSurvey ? (
                              <Pencil className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
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
        surveyTable={tableDialogMode === "edit" ? editingTable || undefined : undefined}
        onSuccess={() => {
          fetchSurveyData();
          fetchSelectedTable();
        }}
      />

      <CopySurveyDialog
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        sourceSurvey={selectedTable}
        onSuccess={handleCopySuccess}
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
