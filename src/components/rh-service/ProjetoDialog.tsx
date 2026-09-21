import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROJETO_STATUS_LABELS, useSaveProjeto, type Consultor, type RhProjeto } from '@/hooks/useRhService';

interface ProjetoDialogProps {
  open: boolean;
  projeto: RhProjeto | null;
  consultores: Consultor[];
  onOpenChange: (open: boolean) => void;
}

const SEM_CONSULTOR = 'sem-consultor';

export const ProjetoDialog = ({ open, projeto, consultores, onOpenChange }: ProjetoDialogProps) => {
  const save = useSaveProjeto();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [escopo, setEscopo] = useState('');
  const [consultorId, setConsultorId] = useState<string>(SEM_CONSULTOR);
  const [status, setStatus] = useState('proposta');
  const [horas, setHoras] = useState('');
  const [valor, setValor] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitulo(projeto?.titulo ?? '');
    setDescricao(projeto?.descricao ?? '');
    setEscopo(projeto?.escopo ?? '');
    setConsultorId(projeto?.consultor_id ?? SEM_CONSULTOR);
    setStatus(projeto?.status ?? 'proposta');
    setHoras(projeto?.horas_estimadas?.toString() ?? '');
    setValor(projeto?.valor_negociado?.toString() ?? '');
    setDataInicio(projeto?.data_inicio?.slice(0, 10) ?? '');
    setDataFim(projeto?.data_fim?.slice(0, 10) ?? '');
  }, [open, projeto]);

  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    await save.mutateAsync({
      id: projeto?.id,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      escopo: escopo.trim() || null,
      consultor_id: consultorId === SEM_CONSULTOR ? null : consultorId,
      status,
      horas_estimadas: horas ? Number(horas) : null,
      valor_negociado: valor ? Number(valor) : null,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{projeto ? 'Editar projeto' : 'Novo projeto'}</DialogTitle>
          <DialogDescription>Valor negociado por projeto — deixe em branco quando ainda não definido.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projeto-titulo">Título</Label>
            <Input id="projeto-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projeto-descricao">Descrição</Label>
            <Textarea id="projeto-descricao" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projeto-escopo">Escopo</Label>
            <Textarea id="projeto-escopo" rows={2} value={escopo} onChange={(e) => setEscopo(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Consultor responsável</Label>
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
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJETO_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projeto-horas">Horas estimadas</Label>
              <Input
                id="projeto-horas"
                type="number"
                min="0"
                step="0.5"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projeto-valor">Valor negociado (R$)</Label>
              <Input
                id="projeto-valor"
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projeto-inicio">Início</Label>
              <Input id="projeto-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projeto-fim">Término</Label>
              <Input id="projeto-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!titulo.trim() || save.isPending}>
            {save.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
