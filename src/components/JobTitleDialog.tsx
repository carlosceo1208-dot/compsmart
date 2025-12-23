import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { CompetencyManager } from "./CompetencyManager";
import { CBOSearchInput } from "./CBOSearchInput";
import { PointsEvaluationTab } from "./PointsEvaluationTab";

interface JobTitleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitleId?: string | null;
  onSuccess: () => void;
}

// Job families are now loaded dynamically from the database

interface JobTitleData {
  code: string;
  job_family: string;
  title: string;
  grade: string;
  cbo: string;
  is_active: boolean;
  summary?: string | null;
  main_responsibilities?: string | null;
  key_factors?: string | null;
  job_impact?: string | null;
  soft_skills?: string | null;
  hard_skills?: string | null;
  required_experience?: string | null;
  required_education?: string | null;
  median_points: number;
  // Hay evaluation fields
  hay_knowhow_technical?: string | null;
  hay_knowhow_managerial?: string | null;
  hay_knowhow_human_relations?: string | null;
  hay_problem_environment?: string | null;
  hay_problem_challenge?: string | null;
  hay_accountability_freedom?: string | null;
  hay_accountability_magnitude?: string | null;
  hay_accountability_impact?: string | null;
  hay_total_points?: number | null;
  hay_profile?: string | null;
  hay_evaluation_notes?: string | null;
}

export function JobTitleDialog({ open, onOpenChange, jobTitleId, onSuccess }: JobTitleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [jobFamilies, setJobFamilies] = useState<string[]>([]);
  const [formData, setFormData] = useState<JobTitleData>({
    code: "",
    job_family: "Profissionais",
    title: "",
    grade: "",
    cbo: "",
    is_active: true,
    summary: "",
    main_responsibilities: "",
    key_factors: "",
    job_impact: "",
    soft_skills: "",
    hard_skills: "",
    required_experience: "",
    required_education: "",
    median_points: 0,
    // Hay fields
    hay_knowhow_technical: "",
    hay_knowhow_managerial: "",
    hay_knowhow_human_relations: "",
    hay_problem_environment: "",
    hay_problem_challenge: "",
    hay_accountability_freedom: "",
    hay_accountability_magnitude: "",
    hay_accountability_impact: "",
    hay_total_points: 0,
    hay_profile: "",
    hay_evaluation_notes: "",
  });
  const [salaryRangeInfo, setSalaryRangeInfo] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchJobFamilies();
      if (jobTitleId) {
        fetchJobTitleData();
      } else {
        resetForm();
      }
    }
  }, [jobTitleId, open]);

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
    if (formData.grade) {
      fetchSalaryRange();
    }
  }, [formData.grade]);

  const fetchJobTitleData = async () => {
    if (!jobTitleId) return;

    try {
      const { data, error } = await supabase
        .from("job_titles")
        .select("*")
        .eq("id", jobTitleId)
        .single();

      if (error) throw error;
      setFormData(data);
    } catch (error: any) {
      console.error("Error fetching job title:", error);
      toast.error("Erro ao carregar dados do cargo");
    }
  };

  const fetchSalaryRange = async () => {
    try {
      // Normalizar grade para formato de 3 dígitos com zeros à esquerda
      // Ex: "3" → "003", "12" → "012", "555" → "555"
      const normalizedGrade = formData.grade.trim().padStart(3, '0');
      
      const { data, error } = await supabase
        .from("salary_ranges")
        .select(`
          min_value,
          max_value,
          salary_tables!inner(is_active)
        `)
        .eq("grade", normalizedGrade)
        .eq("salary_tables.is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const min = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.min_value);
        const max = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.max_value);
        setSalaryRangeInfo(`${min} - ${max}`);
      } else {
        setSalaryRangeInfo("Nenhuma faixa salarial ativa para este grade");
      }
    } catch (error) {
      console.error("Error fetching salary range:", error);
      setSalaryRangeInfo("");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      job_family: "Profissionais",
      title: "",
      grade: "",
      cbo: "",
      is_active: true,
      summary: "",
      main_responsibilities: "",
      key_factors: "",
      job_impact: "",
      soft_skills: "",
      hard_skills: "",
      required_experience: "",
      required_education: "",
      median_points: 0,
      hay_knowhow_technical: "",
      hay_knowhow_managerial: "",
      hay_knowhow_human_relations: "",
      hay_problem_environment: "",
      hay_problem_challenge: "",
      hay_accountability_freedom: "",
      hay_accountability_magnitude: "",
      hay_accountability_impact: "",
      hay_total_points: 0,
      hay_profile: "",
      hay_evaluation_notes: "",
    });
    setSalaryRangeInfo("");
  };

  const handleGenerateAI = async (mode: 'summary' | 'full' = 'full') => {
    // CBO agora é opcional - IA vai sugerir se não fornecido
    if (!formData.title || !formData.grade) {
      toast.error("Preencha título e grade antes de gerar com IA");
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-job-description', {
        body: {
          jobTitle: formData.title,
          grade: formData.grade,
          cbo: formData.cbo || undefined, // Não envia se vazio - IA vai sugerir
          jobFamily: formData.job_family,
          mode
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Update form with AI-generated content
      setFormData(prev => ({
        ...prev,
        // Se IA sugeriu CBO e campo estava vazio, aplica sugestão
        cbo: data.suggested_cbo && !prev.cbo ? data.suggested_cbo : prev.cbo,
        summary: data.summary || prev.summary,
        main_responsibilities: data.main_responsibilities || prev.main_responsibilities,
        key_factors: data.key_factors || prev.key_factors,
        job_impact: data.job_impact || prev.job_impact,
        soft_skills: Array.isArray(data.soft_skills) ? data.soft_skills.join('\n') : prev.soft_skills,
        hard_skills: Array.isArray(data.hard_skills) ? data.hard_skills.join('\n') : prev.hard_skills,
        required_experience: data.required_experience || prev.required_experience,
        required_education: data.required_education || prev.required_education,
      }));

      // Notifica sobre CBO sugerido
      if (data.suggested_cbo && !formData.cbo) {
        toast.success(`CBO sugerido: ${data.suggested_cbo} - ${data.cbo_title}`, {
          description: data.cbo_reasoning,
          duration: 6000,
        });
      } else {
        toast.success(mode === 'full' ? "Descrição completa gerada!" : "Sumário gerado!");
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error("Erro ao gerar descrição com IA");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.grade.trim() || !formData.cbo.trim()) {
      toast.error("Preencha título, grade e CBO");
      return;
    }

    // Validate CBO format
    if (!/^\d{4}-\d{2}$/.test(formData.cbo)) {
      toast.error("CBO deve estar no formato XXXX-XX");
      return;
    }

    setLoading(true);
    try {
      if (jobTitleId) {
        const { error } = await supabase
          .from("job_titles")
          .update(formData)
          .eq("id", jobTitleId);

        if (error) throw error;
        toast.success("Cargo atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("job_titles")
          .insert(formData);

        if (error) throw error;
        toast.success("Cargo criado com sucesso");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving job title:", error);
      toast.error(error.message || "Erro ao salvar cargo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {jobTitleId ? "Editar Cargo" : "Novo Cargo"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basics">📌 Dados Básicos</TabsTrigger>
              <TabsTrigger value="description">📄 Descrição</TabsTrigger>
              <TabsTrigger value="competencies">🧩 Competências</TabsTrigger>
              <TabsTrigger value="requirements">🎓 Requisitos</TabsTrigger>
              <TabsTrigger value="hay">⚖️ Avaliação</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="family">Família do Cargo</Label>
                  <Select value={formData.job_family} onValueChange={(v) => setFormData({...formData, job_family: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jobFamilies.map((family) => (
                        <SelectItem key={family} value={family}>{family}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="code">Código do Cargo</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Ex: ANA-JR-01"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Título do Cargo</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Analista de RH Júnior"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="grade">Grade/Nível</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    placeholder="Ex: 3"
                  />
                </div>
                <div>
                  <Label htmlFor="cbo">CBO</Label>
                  <CBOSearchInput
                    value={formData.cbo}
                    onChange={(cbo) => setFormData({...formData, cbo})}
                    placeholder="Digite código ou título..."
                  />
                </div>
                <div>
                  <Label htmlFor="median_points">Pontos Médios</Label>
                  <Input
                    id="median_points"
                    type="number"
                    value={formData.median_points}
                    onChange={(e) => setFormData({...formData, median_points: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">Cargo Ativo</Label>
              </div>

              {salaryRangeInfo && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Faixa Salarial Vinculada (Grade {formData.grade}):</p>
                    <p className="font-semibold">{salaryRangeInfo}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="description" className="space-y-4 mt-4">
              <div className="flex justify-end mb-2">
                <Button
                  onClick={() => handleGenerateAI('full')}
                  disabled={aiLoading}
                  variant="outline"
                  size="sm"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Gerar Descrição Completa com IA
                </Button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="summary">Sumário do Cargo</Label>
                  <Button
                    onClick={() => handleGenerateAI('summary')}
                    disabled={aiLoading}
                    variant="ghost"
                    size="sm"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Gerar
                  </Button>
                </div>
                <Textarea
                  id="summary"
                  value={formData.summary || ""}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder="Breve descrição executiva do cargo (2-3 frases)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="main_responsibilities">Principais Responsabilidades</Label>
                <Textarea
                  id="main_responsibilities"
                  value={formData.main_responsibilities || ""}
                  onChange={(e) => setFormData({...formData, main_responsibilities: e.target.value})}
                  placeholder="Liste as principais responsabilidades do cargo"
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="key_factors">Fatores Chave</Label>
                <Textarea
                  id="key_factors"
                  value={formData.key_factors || ""}
                  onChange={(e) => setFormData({...formData, key_factors: e.target.value})}
                  placeholder="Competências críticas e fatores determinantes"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="job_impact">Impacto do Cargo</Label>
                <Textarea
                  id="job_impact"
                  value={formData.job_impact || ""}
                  onChange={(e) => setFormData({...formData, job_impact: e.target.value})}
                  placeholder="Impacto organizacional e contribuição esperada"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="competencies" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="soft_skills">Soft Skills (Comportamentais)</Label>
                  <Textarea
                    id="soft_skills"
                    value={formData.soft_skills || ""}
                    onChange={(e) => setFormData({...formData, soft_skills: e.target.value})}
                    placeholder="Ex: Comunicação&#10;Liderança&#10;Trabalho em equipe"
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="hard_skills">Hard Skills (Técnicas)</Label>
                  <Textarea
                    id="hard_skills"
                    value={formData.hard_skills || ""}
                    onChange={(e) => setFormData({...formData, hard_skills: e.target.value})}
                    placeholder="Ex: Excel Avançado&#10;Power BI&#10;SQL"
                    rows={6}
                  />
                </div>
              </div>

              {jobTitleId && (
                <div className="border-t pt-4 mt-4">
                  <CompetencyManager
                    jobTitleId={jobTitleId}
                    jobTitle={formData.title}
                    grade={formData.grade}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="required_experience">Experiência Requerida</Label>
                <Textarea
                  id="required_experience"
                  value={formData.required_experience || ""}
                  onChange={(e) => setFormData({...formData, required_experience: e.target.value})}
                  placeholder="Ex: 5+ anos em gestão de projetos de TI"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="required_education">Formação Acadêmica</Label>
                <Textarea
                  id="required_education"
                  value={formData.required_education || ""}
                  onChange={(e) => setFormData({...formData, required_education: e.target.value})}
                  placeholder="Ex: Superior completo em Administração, Psicologia ou áreas correlatas"
                  rows={4}
                />
              </div>

              {salaryRangeInfo && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Faixa Salarial Vinculada:</p>
                    <p className="font-semibold text-lg">{salaryRangeInfo}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Atualizada automaticamente com base no Grade {formData.grade}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="hay" className="mt-4">
              <PointsEvaluationTab
                jobTitle={formData.title}
                grade={formData.grade}
                jobFamily={formData.job_family}
                summary={formData.summary || ''}
                mainResponsibilities={formData.main_responsibilities || ''}
                hayData={{
                  hay_knowhow_technical: formData.hay_knowhow_technical || '',
                  hay_knowhow_managerial: formData.hay_knowhow_managerial || '',
                  hay_knowhow_human_relations: formData.hay_knowhow_human_relations || '',
                  hay_problem_environment: formData.hay_problem_environment || '',
                  hay_problem_challenge: formData.hay_problem_challenge || '',
                  hay_accountability_freedom: formData.hay_accountability_freedom || '',
                  hay_accountability_magnitude: formData.hay_accountability_magnitude || '',
                  hay_accountability_impact: formData.hay_accountability_impact || '',
                  hay_total_points: formData.hay_total_points || 0,
                  hay_profile: formData.hay_profile || '',
                  hay_evaluation_notes: formData.hay_evaluation_notes || '',
                }}
                onHayDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
                onMedianPointsChange={(points) => setFormData(prev => ({ ...prev, median_points: points }))}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="pt-4 border-t mt-4">
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