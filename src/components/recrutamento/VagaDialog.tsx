import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CargoLibrarySearch, type CargoSelecionado } from "./CargoLibrarySearch";
import {
  CONTRATACAO_LABEL, MODELO_LABEL, SENIORIDADE_LABEL, STATUS_LABEL,
  TalentError, gerarPerfilVaga, salvarCargoNaBiblioteca, useSaveVaga,
  type Vaga, type VagaInput,
} from "@/hooks/useVagas";

const empty: VagaInput = {
  titulo: "", area: "", senioridade: "pleno", cbo: "", descricao_cargo_id: null,
  responsabilidades: "", requisitos_obrigatorios: "", requisitos_desejaveis: "", competencias: [],
  faixa_salarial_min: null, faixa_salarial_max: null, modelo_trabalho: "presencial",
  localizacao: "", tipo_contratacao: "clt", qtd_vagas: 1, status: "rascunho",
};

const bullets = (a: string[]) => a.map((s) => `• ${s}`).join("\n");

export const VagaDialog = ({ open, onOpenChange, vaga }: { open: boolean; onOpenChange: (o: boolean) => void; vaga?: Vaga | null }) => {
  const [f, setF] = useState<VagaInput>(empty);
  const [competenciasTxt, setCompetenciasTxt] = useState("");
  const [fromCbo, setFromCbo] = useState(false);
  const [salvarBiblioteca, setSalvarBiblioteca] = useState(false);
  const [familia, setFamilia] = useState("");
  const [nivel, setNivel] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erroIa, setErroIa] = useState<{ msg: string; retry: boolean } | null>(null);
  const save = useSaveVaga();

  useEffect(() => {
    if (!open) return;
    const base = vaga ? { ...empty, ...vaga } : empty;
    setF(base);
    setCompetenciasTxt((base.competencias ?? []).join(", "));
    setFromCbo(false); setSalvarBiblioteca(false); setFamilia(""); setNivel(""); setErroIa(null);
  }, [open, vaga]);

  const set = <K extends keyof VagaInput>(k: K, v: VagaInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const onSelectCargo = (c: CargoSelecionado) => {
    if (c.kind === "empresa") {
      setFromCbo(false);
      setF((p) => ({
        ...p, titulo: c.title, cbo: c.cbo || p.cbo, descricao_cargo_id: c.id,
        responsabilidades: c.main_responsibilities ?? p.responsabilidades,
        requisitos_obrigatorios: [c.required_education, c.required_experience, c.hard_skills].filter(Boolean).join("\n") || p.requisitos_obrigatorios,
      }));
      if (c.soft_skills) setCompetenciasTxt(c.soft_skills);
      toast.success("Perfil preenchido a partir da biblioteca da empresa.");
    } else {
      setFromCbo(true);
      setF((p) => ({ ...p, titulo: c.title, cbo: c.code, descricao_cargo_id: null }));
      if (c.family) setFamilia(c.family);
      toast.info("Cargo do catálogo CBO selecionado. Use a IA para completar o perfil.");
    }
  };

  const gerar = async () => {
    if (f.titulo.trim().length < 2) { toast.error("Informe o título da vaga antes de gerar."); return; }
    setGerando(true); setErroIa(null);
    try {
      const p = await gerarPerfilVaga({
        titulo: f.titulo, area: f.area ?? "", senioridade: f.senioridade, cbo: f.cbo ?? "",
        descricaoParcial: [f.responsabilidades, f.requisitos_obrigatorios].filter(Boolean).join("\n"),
      });
      setF((prev) => ({
        ...prev,
        responsabilidades: bullets(p.responsabilidades),
        requisitos_obrigatorios: bullets(p.requisitos_obrigatorios),
        requisitos_desejaveis: bullets(p.requisitos_desejaveis),
      }));
      setCompetenciasTxt(p.competencias.join(", "));
      toast.success("Perfil gerado pelo Talent. Revise e ajuste antes de salvar.");
    } catch (e) {
      const status = e instanceof TalentError ? e.status : undefined;
      const msg = e instanceof Error ? e.message : "Falha ao gerar o perfil.";
      setErroIa({ msg, retry: status !== 402 && status !== 403 });
    } finally {
      setGerando(false);
    }
  };

  const onSave = async () => {
    if (f.titulo.trim().length < 2) { toast.error("Informe o título da vaga."); return; }
    if (f.faixa_salarial_min != null && f.faixa_salarial_max != null && f.faixa_salarial_min > f.faixa_salarial_max) {
      toast.error("A faixa salarial mínima não pode ser maior que a máxima."); return;
    }
    const competencias = competenciasTxt.split(/[,\n]/).map((s) => s.replace(/^•\s*/, "").trim()).filter(Boolean);
    let input: VagaInput = { ...f, competencias };
    try {
      if (fromCbo && salvarBiblioteca) {
        if (!familia.trim() || !nivel.trim()) { toast.error("Informe família e nível para cadastrar o cargo na biblioteca."); return; }
        const r = await salvarCargoNaBiblioteca({
          title: f.titulo, cbo: f.cbo ?? "", jobFamily: familia, grade: nivel,
          responsibilities: f.responsabilidades ?? "", hardSkills: f.requisitos_obrigatorios ?? "",
          softSkills: competencias.join(", "), experience: f.requisitos_desejaveis ?? "",
        });
        input = { ...input, descricao_cargo_id: r.id };
        if (r.existed) toast.info("Este cargo já existe na biblioteca — a vaga foi ligada ao cargo existente.");
        else toast.success("Cargo cadastrado na biblioteca da empresa.");
      }
      await save.mutateAsync({ id: vaga?.id, input });
      toast.success(vaga ? "Vaga atualizada." : "Vaga criada.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar a vaga.");
    }
  };

  const numOrNull = (v: string) => (v === "" ? null : Number(v));
  const busy = gerando || save.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>{vaga ? "Editar vaga" : "Nova vaga"}</DialogTitle></DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Buscar descrição de cargo</Label>
            <CargoLibrarySearch onSelect={onSelectCargo} disabled={busy} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5"><Label>Título da vaga *</Label>
              <Input value={f.titulo} disabled={busy} onChange={(e) => set("titulo", e.target.value)} maxLength={200} /></div>
            <div className="space-y-1.5"><Label>Área</Label>
              <Input value={f.area ?? ""} disabled={busy} onChange={(e) => set("area", e.target.value)} maxLength={120} /></div>
            <div className="space-y-1.5"><Label>CBO</Label>
              <Input value={f.cbo ?? ""} disabled={busy} onChange={(e) => set("cbo", e.target.value)} maxLength={20} /></div>
            <Sel label="Senioridade" value={f.senioridade} onChange={(v) => set("senioridade", v as VagaInput["senioridade"])} options={SENIORIDADE_LABEL} disabled={busy} />
            <Sel label="Modelo de trabalho" value={f.modelo_trabalho} onChange={(v) => set("modelo_trabalho", v as VagaInput["modelo_trabalho"])} options={MODELO_LABEL} disabled={busy} />
            <div className="space-y-1.5"><Label>Localização</Label>
              <Input value={f.localizacao ?? ""} disabled={busy} onChange={(e) => set("localizacao", e.target.value)} maxLength={120} /></div>
            <Sel label="Tipo de contratação" value={f.tipo_contratacao} onChange={(v) => set("tipo_contratacao", v as VagaInput["tipo_contratacao"])} options={CONTRATACAO_LABEL} disabled={busy} />
            <div className="space-y-1.5"><Label>Faixa salarial mínima (R$)</Label>
              <Input type="number" min={0} value={f.faixa_salarial_min ?? ""} disabled={busy} onChange={(e) => set("faixa_salarial_min", numOrNull(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Faixa salarial máxima (R$)</Label>
              <Input type="number" min={0} value={f.faixa_salarial_max ?? ""} disabled={busy} onChange={(e) => set("faixa_salarial_max", numOrNull(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Quantidade de vagas</Label>
              <Input type="number" min={1} value={f.qtd_vagas} disabled={busy} onChange={(e) => set("qtd_vagas", Math.max(1, Number(e.target.value) || 1))} /></div>
            <Sel label="Status" value={f.status} onChange={(v) => set("status", v as VagaInput["status"])} options={STATUS_LABEL} disabled={busy} />
          </div>

          <div className="rounded-2xl border p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Perfil da vaga</p>
              <Button type="button" variant="secondary" className="rounded-xl" onClick={gerar} disabled={busy}>
                {gerando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                {gerando ? "Talent gerando o perfil..." : "Gerar perfil da vaga com IA"}
              </Button>
            </div>
            {erroIa && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                  <span>{erroIa.msg}</span>
                  {erroIa.retry && (
                    <Button size="sm" variant="outline" onClick={gerar} disabled={gerando}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Tentar novamente
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <Area label="Responsabilidades" value={f.responsabilidades ?? ""} onChange={(v) => set("responsabilidades", v)} disabled={busy} />
            <Area label="Requisitos obrigatórios" value={f.requisitos_obrigatorios ?? ""} onChange={(v) => set("requisitos_obrigatorios", v)} disabled={busy} />
            <Area label="Requisitos desejáveis" value={f.requisitos_desejaveis ?? ""} onChange={(v) => set("requisitos_desejaveis", v)} disabled={busy} />
            <Area label="Competências (separadas por vírgula)" value={competenciasTxt} onChange={setCompetenciasTxt} disabled={busy} rows={2} />
          </div>

          {fromCbo && (
            <div className="rounded-2xl border p-4 space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={salvarBiblioteca} onCheckedChange={(v) => setSalvarBiblioteca(v === true)} disabled={busy} />
                <span className="text-sm">Cadastrar também este cargo na biblioteca da empresa para reutilizar em próximas vagas</span>
              </label>
              {salvarBiblioteca && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Família do cargo *</Label>
                    <Input value={familia} onChange={(e) => setFamilia(e.target.value)} maxLength={100} disabled={busy} /></div>
                  <div className="space-y-1.5"><Label>Nível / grade *</Label>
                    <Input value={nivel} onChange={(e) => setNivel(e.target.value)} maxLength={50} disabled={busy} /></div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button className="rounded-xl" onClick={onSave} disabled={busy}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar vaga
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Sel = ({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: Record<string, string>; disabled?: boolean }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
      <SelectContent>{Object.entries(options).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
    </Select>
  </div>
);

const Area = ({ label, value, onChange, disabled, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; rows?: number }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Textarea value={value} rows={rows} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="rounded-xl" />
  </div>
);
