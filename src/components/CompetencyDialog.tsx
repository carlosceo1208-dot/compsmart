import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompetencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  jobTitleId: string;
  existingCompetency?: {
    id: string;
    competency: {
      id: string;
      name: string;
      type: string;
      description: string | null;
    };
    required_level: string;
    is_required: boolean;
  } | null;
}

export const CompetencyDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess, 
  jobTitleId,
  existingCompetency 
}: CompetencyDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'hard_skill' | 'soft_skill'>('hard_skill');
  const [level, setLevel] = useState<'basic' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [isRequired, setIsRequired] = useState(true);

  useEffect(() => {
    if (open && existingCompetency) {
      setName(existingCompetency.competency.name);
      setDescription(existingCompetency.competency.description || '');
      setType(existingCompetency.competency.type as 'hard_skill' | 'soft_skill');
      setLevel(existingCompetency.required_level as any);
      setIsRequired(existingCompetency.is_required);
    } else if (open) {
      setName('');
      setDescription('');
      setType('hard_skill');
      setLevel('intermediate');
      setIsRequired(true);
    }
  }, [open, existingCompetency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar se competência já existe
      const { data: existingComp, error: searchError } = await supabase
        .from('competencies')
        .select('id')
        .eq('name', name)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') throw searchError;

      let competencyId: string;

      if (existingComp) {
        competencyId = existingComp.id;
      } else {
        // Criar nova competência
        const { data: newComp, error: createError } = await supabase
          .from('competencies')
          .insert({ name, description, type })
          .select()
          .single();

        if (createError) throw createError;
        competencyId = newComp.id;
      }

      // Associar ao cargo
      if (existingCompetency) {
        const { error: updateError } = await supabase
          .from('job_title_competencies')
          .update({
            required_level: level,
            is_required: isRequired
          })
          .eq('id', existingCompetency.id);

        if (updateError) throw updateError;
      } else {
        const { error: linkError } = await supabase
          .from('job_title_competencies')
          .insert({
            job_title_id: jobTitleId,
            competency_id: competencyId,
            required_level: level,
            is_required: isRequired
          });

        if (linkError) {
          if (linkError.code === '23505') {
            toast.error('Esta competência já está associada a este cargo');
            return;
          }
          throw linkError;
        }
      }

      toast.success(existingCompetency ? 'Competência atualizada' : 'Competência adicionada');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving competency:', error);
      toast.error('Erro ao salvar competência');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingCompetency ? 'Editar Competência' : 'Nova Competência'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome da Competência</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Excel Avançado, Liderança, etc."
              required
              disabled={!!existingCompetency}
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição da competência"
              rows={3}
              disabled={!!existingCompetency}
            />
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)} disabled={!!existingCompetency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hard_skill">Hard Skill (Técnica)</SelectItem>
                <SelectItem value="soft_skill">Soft Skill (Comportamental)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nível Esperado</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="required">Competência Obrigatória</Label>
            <Switch
              id="required"
              checked={isRequired}
              onCheckedChange={setIsRequired}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
