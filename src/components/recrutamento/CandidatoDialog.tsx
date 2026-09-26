import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SENIORIDADE_LABEL, useVagas } from "@/hooks/useVagas";
import { useSalvarCandidato } from "@/hooks/useCandidatos";
import { CURRICULO_MAX_BYTES, CURRICULO_MAX_MB, EMAIL_RE, mascaraTelefone, telefoneValido } from "@/config/recrutamento";

const vazio = { nome: "", email: "", telefone: "", cargo: "", senioridade: "", observacoes: "" };

export const CandidatoDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const [f, setF] = useState(vazio);
  const [vagaIds, setVagaIds] = useState<string[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const { data: vagas = [] } = useVagas();
  const salvar = useSalvarCandidato();

  useEffect(() => { if (open) { setF(vazio); setVagaIds([]); setArquivo(null); setErros({}); } }, [open]);
  const set = (k: keyof typeof vazio, v: string) => setF((p) => ({ ...p, [k]: v }));

  const onArquivo = (file: File | null) => {
    const e = { ...erros }; delete e.curriculo;
    if (file && file.type !== "application/pdf") e.curriculo = "Envie um arquivo PDF.";
    else if (file && file.size > CURRICULO_MAX_BYTES) e.curriculo = `O currículo deve ter até ${CURRICULO_MAX_MB} MB.`;
    setErros(e); setArquivo(e.curriculo ? null : file);
  };

  const onSave = async () => {
    const e: Record<string, string> = {};
    if (f.nome.trim().length < 2) e.nome = "Informe o nome.";
    if (!EMAIL_RE.test(f.email.trim())) e.email = "E-mail inválido.";
    if (f.telefone && !telefoneValido(f.telefone)) e.telefone = "Telefone inválido.";
    if (erros.curriculo) e.curriculo = erros.curriculo;
    setErros(e);
    if (Object.keys(e).length) return;
    try {
      const r = await salvar.mutateAsync({ input: { ...f, email: f.email.trim().toLowerCase(), vagaIds }, curriculo: arquivo });
      toast.success(r.existed ? "Candidato já existia — dados e vínculos atualizados, sem duplicar." : "Candidato cadastrado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o candidato.");
    }
  };

  const busy = salvar.isPending;
  const abertas = vagas.filter((v) => v.status !== "fechada");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>Novo candidato</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome *" erro={erros.nome} className="sm:col-span-2"><Input value={f.nome} maxLength={150} disabled={busy} onChange={(e) => set("nome", e.target.value)} /></Campo>
          <Campo label="E-mail *" erro={erros.email}><Input type="email" value={f.email} maxLength={255} disabled={busy} onChange={(e) => set("email", e.target.value)} /></Campo>
          <Campo label="Telefone" erro={erros.telefone}><Input value={f.telefone} disabled={busy} placeholder="(00) 00000-0000" onChange={(e) => set("telefone", mascaraTelefone(e.target.value))} /></Campo>
          <Campo label="Cargo pretendido"><Input value={f.cargo} maxLength={150} disabled={busy} onChange={(e) => set("cargo", e.target.value)} /></Campo>
          <Campo label="Senioridade">
            <Select value={f.senioridade} onValueChange={(v) => set("senioridade", v)} disabled={busy}>
              <SelectTrigger className="rounded-xl" aria-label="Senioridade"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{Object.entries(SENIORIDADE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Campo>
          <Campo label={`Currículo (PDF até ${CURRICULO_MAX_MB} MB)`} erro={erros.curriculo} className="sm:col-span-2">
            <Input type="file" accept="application/pdf" disabled={busy} onChange={(e) => onArquivo(e.target.files?.[0] ?? null)} />
          </Campo>
          <Campo label="Observações" className="sm:col-span-2"><Textarea rows={3} maxLength={2000} value={f.observacoes} disabled={busy} onChange={(e) => set("observacoes", e.target.value)} className="rounded-xl" /></Campo>
          <div className="sm:col-span-2 space-y-2">
            <Label>Vincular a vagas (entram em Triagem)</Label>
            {abertas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma vaga aberta.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-xl border p-3">
                {abertas.map((v) => (
                  <label key={v.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={vagaIds.includes(v.id)} disabled={busy}
                      onCheckedChange={(c) => setVagaIds((p) => c === true ? [...p, v.id] : p.filter((x) => x !== v.id))} />
                    <span className="truncate">{v.titulo}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button className="rounded-xl" onClick={onSave} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar candidato</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Campo = ({ label, erro, className, children }: { label: string; erro?: string; className?: string; children: React.ReactNode }) => (
  <div className={`space-y-1.5 ${className ?? ""}`}>
    <Label>{label}</Label>
    {children}
    {erro && <p className="text-xs text-destructive">{erro}</p>}
  </div>
);
