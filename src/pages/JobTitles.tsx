import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { JobTitleDialog } from "@/components/JobTitleDialog";
import { JobTitleBulkImport } from "@/components/JobTitleBulkImport";
import { JobTitlePreview } from "@/components/JobTitlePreview";
import { JobFamilyManager } from "@/components/JobFamilyManager";
import {
  Plus, 
  Upload, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Edit, 
  Sparkles,
  CheckCircle2,
  XCircle,
  Briefcase,
  Building2,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Job families are now loaded dynamically from the database

const familyColors: Record<string, string> = {
  'Analistas': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Profissionais': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Consultores': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Especialistas': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Coordenadores': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'Supervisores': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Gerentes': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'Executivos - Diretores': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Lideres-Projetos': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

interface JobTitle {
  id: string;
  code: string;
  title: string;
  grade: string;
  cbo: string;
  is_active: boolean;
  summary?: string | null;
  salary_ranges?: {
    min_value: number;
    max_value: number;
  } | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function JobTitlesPage() {
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [jobFamilies, setJobFamilies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [familyManagerOpen, setFamilyManagerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  
  // Sorting
  type SortField = "title" | "grade" | null;
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    families: 0,
  });

  // Grouping
  const [groupBy, setGroupBy] = useState<"family" | "alphabetic" | "grade">("family");

  // Alert for inactivation
  const [inactivateAlert, setInactivateAlert] = useState<{ id: string; title: string; linkedCount: number } | null>(null);

  useEffect(() => {
    fetchJobTitles();
    fetchJobFamilies();
  }, []);

  const fetchJobFamilies = async () => {
    const { data } = await supabase
      .from('job_families')
      .select('name')
      .eq('is_active', true)
      .order('name');
    
    if (data) {
      setJobFamilies(data.map(f => f.name));
    }
  };

  useEffect(() => {
    calculateStats();
  }, [jobTitles]);

  const fetchJobTitles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("job_titles")
        .select(`
          *,
          salary_ranges!job_titles_salary_range_id_fkey(
            min_value,
            max_value
          )
        `)
        .order("title");

      if (error) throw error;
      setJobTitles(data || []);
    } catch (error: any) {
      console.error("Error fetching job titles:", error);
      toast.error("Erro ao carregar cargos");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = jobTitles.length;
    const active = jobTitles.filter(j => j.is_active).length;
    const inactive = total - active;
    const families = new Set(jobTitles.map(j => j.job_family)).size;
    
    setStats({ total, active, inactive, families });
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

  const normalizeGrade = (grade: string): string => {
    const cleaned = grade.trim().toUpperCase();
    const numericMatch = cleaned.match(/^0*(\d+)$/);
    if (numericMatch) return numericMatch[1];
    return cleaned;
  };

  const filteredData = jobTitles.filter(job => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matches = 
        job.title.toLowerCase().includes(search) ||
        job.code.toLowerCase().includes(search) ||
        job.cbo.toLowerCase().includes(search);
      if (!matches) return false;
    }

    // Family filter
    if (familyFilter !== "all" && job.job_family !== familyFilter) return false;

    // Grade filter
    if (gradeFilter !== "all" && job.grade !== gradeFilter) return false;

    // Status filter
    if (statusFilter === "active" && !job.is_active) return false;
    if (statusFilter === "inactive" && job.is_active) return false;

    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    
    let aVal = sortField === "title" ? a.title : normalizeGrade(a.grade);
    let bVal = sortField === "title" ? b.title : normalizeGrade(b.grade);
    
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

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleInactivate = async (id: string) => {
    // Check for linked employees
    const { data: employees, error: empError } = await supabase
      .from("profiles")
      .select("id")
      .eq("job_title_id", id);

    if (empError) {
      toast.error("Erro ao verificar colaboradores vinculados");
      return;
    }

    const linkedCount = employees?.length || 0;
    const job = jobTitles.find(j => j.id === id);

    if (linkedCount > 0) {
      setInactivateAlert({
        id,
        title: job?.title || "",
        linkedCount
      });
    } else {
      await toggleActiveStatus(id, false);
    }
  };

  const toggleActiveStatus = async (id: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("job_titles")
        .update({ is_active: newStatus } as any)
        .eq("id", id);

      if (error) throw error;

      toast.success(newStatus ? "Cargo ativado" : "Cargo inativado");
      fetchJobTitles();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleGenerateAI = async (id: string) => {
    const job = jobTitles.find(j => j.id === id);
    if (!job) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-job-description', {
        body: {
          jobTitle: job.title,
          grade: job.grade,
          cbo: job.cbo,
          jobFamily: job.job_family,
          mode: 'summary'
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Update with summary
      const { error: updateError } = await supabase
        .from("job_titles")
        .update({ summary: data.summary } as any)
        .eq("id", id);

      if (updateError) throw updateError;

      toast.success("Sumário gerado com sucesso!");
      fetchJobTitles();
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast.error("Erro ao gerar sumário");
    }
  };

  const uniqueGrades = Array.from(new Set(jobTitles.map(j => j.grade))).sort();

  // Group data by selected grouping
  const groupedData = () => {
    if (groupBy === "family") {
      const groups: Record<string, typeof sortedData> = {};
      sortedData.forEach(job => {
        if (!groups[job.job_family]) groups[job.job_family] = [];
        groups[job.job_family].push(job);
      });
      return groups;
    } else if (groupBy === "grade") {
      const groups: Record<string, typeof sortedData> = {};
      sortedData.forEach(job => {
        if (!groups[job.grade]) groups[job.grade] = [];
        groups[job.grade].push(job);
      });
      return groups;
    }
    // Alphabetic - no grouping needed
    return { "Todos": sortedData };
  };

  const renderJobRow = (job: any) => (
    <TableRow key={job.id}>
      <TableCell>
        <Badge variant="outline" className={familyColors[job.job_family]}>
          {job.job_family}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {job.code || "-"}
      </TableCell>
      <TableCell>
        <JobTitlePreview
          jobTitle={job.title}
          summary={job.summary}
          grade={job.grade}
          cbo={job.cbo}
          salaryRange={job.salary_ranges}
          onGenerateAI={() => handleGenerateAI(job.id)}
          onViewDetails={() => handleEdit(job.id)}
        />
      </TableCell>
      <TableCell className="text-center">{job.grade}</TableCell>
      <TableCell className="font-mono text-xs">{job.cbo}</TableCell>
      <TableCell>
        {job.salary_ranges ? (
          <span className="text-sm">
            {formatCurrency(job.salary_ranges.min_value)} - {formatCurrency(job.salary_ranges.max_value)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">N/A</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={job.is_active ? "success" : "destructive"}>
          {job.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
          {job.is_active ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">⋮</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(job.id)}>
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(job.id)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Cargo
            </DropdownMenuItem>
            {!job.summary && (
              <DropdownMenuItem onClick={() => handleGenerateAI(job.id)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Descrição com IA
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {job.is_active ? (
              <DropdownMenuItem 
                onClick={() => handleInactivate(job.id)}
                className="text-destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Inativar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => toggleActiveStatus(job.id, true)}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Ativar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🏢 Plano de Cargos & Salários</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie cargos, descrições e competências
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Cargos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cargos Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cargos Inativos</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Famílias</p>
                <p className="text-2xl font-bold">{stats.families}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>🔍 Buscar</Label>
              <Input
                placeholder="Título, código ou CBO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>📂 Família</Label>
              <Select value={familyFilter} onValueChange={setFamilyFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {jobFamilies.map(family => (
                    <SelectItem key={family} value={family}>{family}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>🎚️ Grade</Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueGrades.map(grade => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>🚦 Status</Label>
              <RadioGroup value={statusFilter} onValueChange={setStatusFilter} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">Todos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active" className="cursor-pointer">Ativos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="inactive" />
                  <Label htmlFor="inactive" className="cursor-pointer">Inativos</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cargo
        </Button>
        <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Importação em Massa
        </Button>
        <Button variant="outline" onClick={() => setFamilyManagerOpen(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Gerenciar Famílias
        </Button>
      </div>

      {/* Grouping Tabs */}
      <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
        <TabsList>
          <TabsTrigger value="family">📂 Por Família</TabsTrigger>
          <TabsTrigger value="alphabetic">🔤 Alfabético</TabsTrigger>
          <TabsTrigger value="grade">📊 Por Grade</TabsTrigger>
        </TabsList>

        <TabsContent value={groupBy} className="space-y-4">
          {Object.entries(groupedData()).map(([group, jobs]) => (
            <Card key={group}>
              {groupBy !== "alphabetic" && (
                <div className="p-4 border-b bg-muted/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    {groupBy === "family" && (
                      <Badge variant="outline" className={familyColors[group]}>
                        {group}
                      </Badge>
                    )}
                    {groupBy === "grade" && <span>Grade {group}</span>}
                    <span className="text-sm text-muted-foreground">({jobs.length})</span>
                  </h3>
                </div>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Família</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                        Título do Cargo
                        {sortField === "title" && (
                          sortDirection === "asc" ? <ArrowUp className="inline w-3 h-3 ml-1" /> : <ArrowDown className="inline w-3 h-3 ml-1" />
                        )}
                      </TableHead>
                      <TableHead className="cursor-pointer text-center" onClick={() => handleSort("grade")}>
                        Grade
                        {sortField === "grade" && (
                          sortDirection === "asc" ? <ArrowUp className="inline w-3 h-3 ml-1" /> : <ArrowDown className="inline w-3 h-3 ml-1" />
                        )}
                      </TableHead>
                      <TableHead>CBO</TableHead>
                      <TableHead>Faixa Salarial</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Nenhum cargo encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      jobs.map(renderJobRow)
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <JobTitleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        jobTitleId={editingId}
        onSuccess={fetchJobTitles}
      />

      <JobTitleBulkImport
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onSuccess={fetchJobTitles}
      />

      <AlertDialog open={!!inactivateAlert} onOpenChange={() => setInactivateAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar Cargo</AlertDialogTitle>
            <AlertDialogDescription>
              ⚠️ Este cargo possui <strong>{inactivateAlert?.linkedCount} colaborador(es)</strong> vinculado(s). 
              Deseja realmente inativar o cargo <strong>"{inactivateAlert?.title}"</strong>?
              <br /><br />
              Os colaboradores continuarão vinculados ao cargo, mas ele não aparecerá mais para novos cadastros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (inactivateAlert) {
                  toggleActiveStatus(inactivateAlert.id, false);
                  setInactivateAlert(null);
                }
              }}
            >
              Inativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <JobFamilyManager
        open={familyManagerOpen}
        onOpenChange={(open) => {
          setFamilyManagerOpen(open);
          if (!open) {
            fetchJobFamilies();
            fetchJobTitles();
          }
        }}
      />
    </div>
  );
}