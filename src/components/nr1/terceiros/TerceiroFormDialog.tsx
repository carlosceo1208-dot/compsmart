import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Terceiro } from '@/hooks/useNr1Terceiros';
import { useUpsertTerceiro, useNr1TerceiroPgrs, useUploadPgr, downloadPgr } from '@/hooks/useNr1Terceiros';
import { formatCnpj, formatPhone, isValidCnpj, onlyDigits } from '@/lib/cnpj';
import { Download, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  terceiro?: Terceiro | null;
}

const GRAU_RISCO_INFO: Record<number, { titulo: string; descricao: string; cor: string }> = {
  1: {
    titulo: 'Grau 1 — Risco Leve',
    descricao: 'Atividades administrativas, comércio varejista, serviços educacionais e similares. Exigências básicas de SST; PGR simplificado pode ser aplicável conforme porte.',
    cor: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  },
  2: {
    titulo: 'Grau 2 — Risco Moderado',
    descricao: 'Atividades como transporte, hotelaria, restaurantes e indústrias leves. Requer PGR completo, treinamentos periódicos e controle de exposições.',
    cor: 'bg-amber-50 border-amber-200 text-amber-900',
  },
  3: {
    titulo: 'Grau 3 — Risco Alto',
    descricao: 'Indústrias químicas, metalurgia, frigoríficos e construção em geral. Exige PGR robusto, PCMSO, EPIs específicos, brigada e auditorias frequentes.',
    cor: 'bg-orange-50 border-orange-200 text-orange-900',
  },
  4: {
    titulo: 'Grau 4 — Risco Crítico',
    descricao: 'Construção pesada, mineração, energia, óleo e gás, demolição. Requer NR-1/NR-4/NR-18/NR-22 plenos, SESMT dimensionado, controle rigoroso e PPRA/PGR auditável.',
    cor: 'bg-red-50 border-red-200 text-red-900',
  },
};

export function TerceiroFormDialog({ open, onOpenChange, terceiro }: Props) {
  const upsert = useUpsertTerceiro();
  const uploadPgr = useUploadPgr();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentTerceiroId, setCurrentTerceiroId] = useState<string | null>(terceiro?.id ?? null);
  const { data: pgrs = [] } = useNr1TerceiroPgrs(currentTerceiroId);
  const [razao, setRazao] = useState('');
  const [fantasia, setFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [contatoEmail, setContatoEmail] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [numCol, setNumCol] = useState('');
  const [area, setArea] = useState('');
  const [grauRisco, setGrauRisco] = useState<string>('');
  const [emergNome, setEmergNome] = useState('');
  const [emergTelefone, setEmergTelefone] = useState('');
  const [emergEmail, setEmergEmail] = useState('');
  const [contratoInicio, setContratoInicio] = useState('');
  const [obs, setObs] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const t = terceiro as any;
      setRazao(terceiro?.razao_social ?? '');
      setFantasia(terceiro?.nome_fantasia ?? '');
      setCnpj(formatCnpj(terceiro?.cnpj ?? ''));
      setContatoNome(terceiro?.contato_nome ?? '');
      setContatoEmail(terceiro?.contato_email ?? '');
      setContatoTelefone(formatPhone(terceiro?.contato_telefone ?? ''));
      setNumCol(terceiro?.num_colaboradores?.toString() ?? '');
      setArea(terceiro?.area_atuacao ?? '');
      setGrauRisco(t?.grau_risco ? String(t.grau_risco) : '');
      setEmergNome(t?.emergencia_nome ?? '');
      setEmergTelefone(formatPhone(t?.emergencia_telefone ?? ''));
      setEmergEmail(t?.emergencia_email ?? '');
      setContratoInicio(t?.contrato_inicio ?? '');
      setObs(terceiro?.observacoes ?? '');
      setCurrentTerceiroId(terceiro?.id ?? null);
      setErrors({});
    }
  }, [open, terceiro]);

  const grauInfo = useMemo(() => (grauRisco ? GRAU_RISCO_INFO[parseInt(grauRisco, 10)] : null), [grauRisco]);

  const buildPayload = () => ({
    id: currentTerceiroId ?? undefined,
    razao_social: razao.trim(),
    nome_fantasia: fantasia.trim() || null,
    cnpj: onlyDigits(cnpj),
    contato_nome: contatoNome.trim() || null,
    contato_email: contatoEmail.trim() || null,
    contato_telefone: onlyDigits(contatoTelefone) || null,
    num_colaboradores: numCol ? parseInt(numCol, 10) : null,
    area_atuacao: area.trim() || null,
    observacoes: obs.trim() || null,
    grau_risco: grauRisco ? parseInt(grauRisco, 10) : null,
    emergencia_nome: emergNome.trim() || null,
    emergencia_telefone: onlyDigits(emergTelefone) || null,
    emergencia_email: emergEmail.trim() || null,
    contrato_inicio: contratoInicio || null,
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (razao.trim().length < 3) errs.razao = 'Razão social com ao menos 3 caracteres.';
    if (!isValidCnpj(cnpj)) errs.cnpj = 'CNPJ inválido.';
    if (contatoEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contatoEmail)) errs.email = 'Email inválido.';
    if (emergEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emergEmail)) errs.emergEmail = 'Email inválido.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const ensureSaved = async (): Promise<string | null> => {
    const res = await upsert.mutateAsync(buildPayload() as any);
    setCurrentTerceiroId(res.id);
    return res.id;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await ensureSaved();
    onOpenChange(false);
  };

  const handleAttachClick = () => {
    if (!validate()) {
      toast.error('Preencha Razão social e CNPJ antes de anexar o PGR.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const id = await ensureSaved();
      if (!id) return;
      const versao = `v${pgrs.length + 1}`;
      await uploadPgr.mutateAsync({ terceiroId: id, file, versao });
    } catch {
      // toasts tratados nos hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{terceiro ? 'Editar empresa terceira' : 'Nova empresa terceira'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
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
              <Label>Grau de risco (NR-4)</Label>
              <Select value={grauRisco} onValueChange={setGrauRisco}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grau de risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Grau 1 — Risco Leve</SelectItem>
                  <SelectItem value="2">Grau 2 — Risco Moderado</SelectItem>
                  <SelectItem value="3">Grau 3 — Risco Alto</SelectItem>
                  <SelectItem value="4">Grau 4 — Risco Crítico</SelectItem>
                </SelectContent>
              </Select>
              {grauInfo && (
                <div className={`mt-2 rounded-md border p-3 text-xs ${grauInfo.cor}`}>
                  <p className="font-semibold mb-1">{grauInfo.titulo}</p>
                  <p className="leading-relaxed">{grauInfo.descricao}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Contato de emergência</p>
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={emergNome} onChange={(e) => setEmergNome(e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={emergTelefone} onChange={(e) => setEmergTelefone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" />
            </div>
            <div className="md:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={emergEmail} onChange={(e) => setEmergEmail(e.target.value)} />
              {errors.emergEmail && <p className="text-xs text-destructive mt-1">{errors.emergEmail}</p>}
            </div>

            <div className="md:col-span-2">
              <Label>Início do contrato de prestação de serviços</Label>
              <Input type="date" value={contratoInicio} onChange={(e) => setContratoInicio(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
            </div>

            <div className="md:col-span-2 pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Documentos PGR
                </p>
                <span className="text-xs text-muted-foreground">{pgrs.length} arquivo(s)</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                size="sm"
                className="w-full mb-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleAttachClick}
                disabled={upsert.isPending || uploadPgr.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadPgr.isPending ? 'Enviando...' : (currentTerceiroId ? 'Anexar novo PGR' : 'Salvar empresa e anexar PGR')}
              </Button>

              {pgrs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  Nenhum PGR enviado ainda.
                </p>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full mb-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => downloadPgr(pgrs[0].file_path, pgrs[0].file_name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar último PGR (v{pgrs[0].versao})
                  </Button>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pgrs.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border p-2 bg-muted/30">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{p.file_name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              v{p.versao}{p.data_vencimento ? ` • venc. ${new Date(p.data_vencimento).toLocaleDateString('pt-BR')}` : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => downloadPgr(p.file_path, p.file_name)}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" /> Baixar
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
