import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Terceiro } from '@/hooks/useNr1Terceiros';
import { useUpsertTerceiro } from '@/hooks/useNr1Terceiros';
import { formatCnpj, formatPhone, isValidCnpj, onlyDigits } from '@/lib/cnpj';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  terceiro?: Terceiro | null;
}

export function TerceiroFormDialog({ open, onOpenChange, terceiro }: Props) {
  const upsert = useUpsertTerceiro();
  const [razao, setRazao] = useState('');
  const [fantasia, setFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [contatoEmail, setContatoEmail] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [numCol, setNumCol] = useState('');
  const [area, setArea] = useState('');
  const [obs, setObs] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setRazao(terceiro?.razao_social ?? '');
      setFantasia(terceiro?.nome_fantasia ?? '');
      setCnpj(formatCnpj(terceiro?.cnpj ?? ''));
      setContatoNome(terceiro?.contato_nome ?? '');
      setContatoEmail(terceiro?.contato_email ?? '');
      setContatoTelefone(formatPhone(terceiro?.contato_telefone ?? ''));
      setNumCol(terceiro?.num_colaboradores?.toString() ?? '');
      setArea(terceiro?.area_atuacao ?? '');
      setObs(terceiro?.observacoes ?? '');
      setErrors({});
    }
  }, [open, terceiro]);

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (razao.trim().length < 3) errs.razao = 'Razão social com ao menos 3 caracteres.';
    if (!isValidCnpj(cnpj)) errs.cnpj = 'CNPJ inválido.';
    if (contatoEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contatoEmail)) errs.email = 'Email inválido.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    await upsert.mutateAsync({
      id: terceiro?.id,
      razao_social: razao.trim(),
      nome_fantasia: fantasia.trim() || null,
      cnpj: onlyDigits(cnpj),
      contato_nome: contatoNome.trim() || null,
      contato_email: contatoEmail.trim() || null,
      contato_telefone: onlyDigits(contatoTelefone) || null,
      num_colaboradores: numCol ? parseInt(numCol, 10) : null,
      area_atuacao: area.trim() || null,
      observacoes: obs.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{terceiro ? 'Editar empresa terceira' : 'Nova empresa terceira'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Razão social *</Label>
            <Input value={razao} onChange={(e) => setRazao(e.target.value)} />
            {errors.razao && <p className="text-xs text-destructive mt-1">{errors.razao}</p>}
          </div>
          <div>
            <Label>Nome fantasia</Label>
            <Input value={fantasia} onChange={(e) => setFantasia(e.target.value)} />
          </div>
          <div>
            <Label>CNPJ *</Label>
            <Input value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" />
            {errors.cnpj && <p className="text-xs text-destructive mt-1">{errors.cnpj}</p>}
          </div>
          <div>
            <Label>Contato (nome)</Label>
            <Input value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)} />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={contatoTelefone} onChange={(e) => setContatoTelefone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <Label>Nº colaboradores</Label>
            <Input type="number" min={0} value={numCol} onChange={(e) => setNumCol(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Área de atuação</Label>
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex.: Limpeza, Segurança, TI..." />
          </div>
          <div className="md:col-span-2">
            <Label>Observações</Label>
            <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
