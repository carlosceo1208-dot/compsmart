import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSaveConsultor, type Consultor } from '@/hooks/useRhService';

interface ConsultorDialogProps {
  open: boolean;
  consultor: Consultor | null;
  onOpenChange: (open: boolean) => void;
}

export const ConsultorDialog = ({ open, consultor, onOpenChange }: ConsultorDialogProps) => {
  const save = useSaveConsultor();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [bio, setBio] = useState('');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!open) return;
    setNome(consultor?.nome ?? '');
    setEmail(consultor?.email ?? '');
    setEspecialidade(consultor?.especialidade ?? '');
    setBio(consultor?.bio ?? '');
    setAtivo(consultor?.ativo ?? true);
  }, [open, consultor]);

  const handleSubmit = async () => {
    if (!nome.trim() || !email.trim()) return;
    await save.mutateAsync({
      id: consultor?.id,
      nome: nome.trim(),
      email: email.trim(),
      especialidade: especialidade.trim() || null,
      bio: bio.trim() || null,
      ativo,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{consultor ? 'Editar consultor' : 'Novo consultor'}</DialogTitle>
          <DialogDescription>Consultor sênior vinculado à empresa atual.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consultor-nome">Nome</Label>
            <Input id="consultor-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultor-email">E-mail</Label>
            <Input id="consultor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultor-especialidade">Especialidade</Label>
            <Input
              id="consultor-especialidade"
              placeholder="Remuneração, NR-1, clima, cargos..."
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultor-bio">Bio</Label>
            <Textarea id="consultor-bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <Label htmlFor="consultor-ativo">Consultor ativo</Label>
              <p className="text-xs text-muted-foreground">Inativos deixam de aparecer como responsáveis.</p>
            </div>
            <Switch id="consultor-ativo" checked={ativo} onCheckedChange={setAtivo} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!nome.trim() || !email.trim() || save.isPending}>
            {save.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
