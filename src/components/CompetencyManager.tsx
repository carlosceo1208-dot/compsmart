import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Plus, Edit, Trash2, Brain, Briefcase } from 'lucide-react';
import { CompetencyBadge } from './CompetencyBadge';
import { CompetencyDialog } from './CompetencyDialog';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface CompetencyManagerProps {
  jobTitleId: string;
  jobTitle: string;
  grade: string;
}

interface JobCompetency {
  id: string;
  competency: {
    id: string;
    name: string;
    type: string;
    description: string | null;
  };
  required_level: string;
  is_required: boolean;
}

export const CompetencyManager = ({ jobTitleId, jobTitle, grade }: CompetencyManagerProps) => {
  const [competencies, setCompetencies] = useState<JobCompetency[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<JobCompetency | null>(null);
  const [competencyToDelete, setCompetencyToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetencies();
  }, [jobTitleId]);

  const fetchCompetencies = async () => {
    try {
      const { data, error } = await supabase
        .from('job_title_competencies')
        .select(`
          id,
          required_level,
          is_required,
          competency:competencies (
            id,
            name,
            type,
            description
          )
        `)
        .eq('job_title_id', jobTitleId);

      if (error) throw error;
      setCompetencies(data as any || []);
    } catch (error) {
      console.error('Error fetching competencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggestions = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-job-competencies', {
        body: {
          jobTitle,
          grade,
          existingCompetencies: competencies.map(c => ({ name: c.competency.name }))
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Adicionar competências sugeridas
      const allSuggestions = [
        ...(data.hard_skills || []).map((s: any) => ({ ...s, type: 'hard_skill' })),
        ...(data.soft_skills || []).map((s: any) => ({ ...s, type: 'soft_skill' }))
      ];

      let addedCount = 0;

      for (const suggestion of allSuggestions) {
        try {
          // Verificar se competência já existe
          const { data: existingComp, error: searchError } = await supabase
            .from('competencies')
            .select('id')
            .eq('name', suggestion.name)
            .maybeSingle();

          if (searchError && searchError.code !== 'PGRST116') continue;

          let competencyId: string;

          if (existingComp) {
            competencyId = existingComp.id;
          } else {
            const { data: newComp, error: createError } = await supabase
              .from('competencies')
              .insert({
                name: suggestion.name,
                description: suggestion.description,
                type: suggestion.type
              })
              .select()
              .single();

            if (createError) continue;
            competencyId = newComp.id;
          }

          // Verificar se já está associada ao cargo
          const { data: existingLink } = await supabase
            .from('job_title_competencies')
            .select('id')
            .eq('job_title_id', jobTitleId)
            .eq('competency_id', competencyId)
            .maybeSingle();

          if (existingLink) continue;

          // Associar ao cargo
          const { error: linkError } = await supabase
            .from('job_title_competencies')
            .insert({
              job_title_id: jobTitleId,
              competency_id: competencyId,
              required_level: suggestion.suggested_level || 'intermediate',
              is_required: true
            });

          if (!linkError) addedCount++;
        } catch (err) {
          console.error('Error adding suggestion:', err);
        }
      }

      if (addedCount > 0) {
        toast.success(`${addedCount} competências adicionadas pela IA`);
        fetchCompetencies();
      } else {
        toast.info('Nenhuma nova competência foi sugerida');
      }
    } catch (error: any) {
      console.error('Error getting AI suggestions:', error);
      toast.error('Erro ao obter sugestões da IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!competencyToDelete) return;

    try {
      const { error } = await supabase
        .from('job_title_competencies')
        .delete()
        .eq('id', competencyToDelete);

      if (error) throw error;

      toast.success('Competência removida');
      fetchCompetencies();
    } catch (error) {
      console.error('Error deleting competency:', error);
      toast.error('Erro ao remover competência');
    } finally {
      setDeleteDialogOpen(false);
      setCompetencyToDelete(null);
    }
  };

  const hardSkills = competencies.filter(c => c.competency.type === 'hard_skill');
  const softSkills = competencies.filter(c => c.competency.type === 'soft_skill');

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando competências...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Competências do Cargo</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAISuggestions}
            disabled={aiLoading}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {aiLoading ? 'Sugerindo...' : 'Sugerir com IA'}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedCompetency(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Hard Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Hard Skills (Técnicas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hardSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma competência técnica cadastrada</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hardSkills.map((comp) => (
                  <div key={comp.id} className="group relative">
                    <CompetencyBadge
                      name={comp.competency.name}
                      level={comp.required_level as any}
                      type="hard_skill"
                      isRequired={comp.is_required}
                    />
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6 rounded-full"
                        onClick={() => {
                          setSelectedCompetency(comp);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-6 w-6 rounded-full"
                        onClick={() => {
                          setCompetencyToDelete(comp.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Soft Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Soft Skills (Comportamentais)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {softSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma competência comportamental cadastrada</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {softSkills.map((comp) => (
                  <div key={comp.id} className="group relative">
                    <CompetencyBadge
                      name={comp.competency.name}
                      level={comp.required_level as any}
                      type="soft_skill"
                      isRequired={comp.is_required}
                    />
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6 rounded-full"
                        onClick={() => {
                          setSelectedCompetency(comp);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-6 w-6 rounded-full"
                        onClick={() => {
                          setCompetencyToDelete(comp.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CompetencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchCompetencies}
        jobTitleId={jobTitleId}
        existingCompetency={selectedCompetency}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Competência</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta competência do cargo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
