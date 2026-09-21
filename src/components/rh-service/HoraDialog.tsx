import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSaveHora, type Consultor, type RhHora, type RhProjeto } from '@/hooks/useRhService';

interface HoraDialogProps {
  open: boolean;
  hora: RhHora | null;
  projetos: RhProjeto[];
  consultores: Consultor[];
  onOpenChange: (open: boolean) => void;
}

const SEM_CONSULTOR = 'sem-consultor';

export const HoraDialog = ({ open, hora, projetos, consultores, onOpenChange }: HoraDialogProps) => {
  const save = useSaveHora();
  const [projetoId, setProjetoId] = useState('');
  const [consultorId, setConsultorId] = useState(SEM_CONSULTOR);
  const [quantidade, setQuantidade] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');

  useEffect(() => {
    if (!open) return;
    setProjetoId(hora?.projeto_id ?? projetos[0]?.id ?? '');
    setConsultorId(hora?.consultor_id ?? SEM_CONSULTOR);
    setQuantidade(hora?.horas?.toString() ?? '');
    setDescricao(hora?.descricao ?? '');
    setData(hora?.data?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  }, [open, hora, projetos]);

  const quantidadeNumero = Number(quantidade);
  const invalido = !projetoId || !data || !quantidade || !Number.isFinite(quantidadeNumero) || quantidadeNumero <= 0;

  const handleSubmit = async () => {
    if (invalido) return;
    await save.mutateAsync({
      id: hora?.id,
      projeto_id: projetoId,
      consultor_id: consultorId === SEM_CONSULTOR ? null : consultorId,
      horas: quantidadeNumero,
      descricao: descricao.trim() || null,
      data,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{hora ? 'Editar horas' : 'Registrar horas'}</DialogTitle>
          <DialogDescription>Controle das horas aplicadas no pacote de consultoria.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Projeto</Label>
            <Select value={projetoId} onValueChange={setProjetoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o projeto" />
              </SelectTrigger>
              <SelectContent>
                {projetos.map((projeto) => (
                  <SelectItem key={projeto.id} value={projeto.id}>
                    {projeto.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Consultor</Label>
            <Select value={consultorId} onValueChange={setConsultorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_CONSULTOR}>Sem consultor</SelectItem>
                {consultores.map((consultor) => (
                  <SelectItem key={consultor.id} value={consultor.id}>
                    {consultor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hora-quantidade">Horas</Label>
              <Input
                id="hora-quantidade"
                type="number"
                min="0.5"
                step="0.5"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora-data">Data</Label>
              <Input id="hora-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hora-descricao">Descrição</Label>
            <Textarea id="hora-descricao" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={invalido || save.isPending}>
            {save.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
