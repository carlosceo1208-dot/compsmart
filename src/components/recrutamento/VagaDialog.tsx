import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
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
import { CidadeInput } from "./CidadeInput";
import { UFS } from "@/lib/brasil";
import { useSugestaoFaixa } from "@/hooks/useSugestaoFaixa";
import {
  CONTRATACAO_LABEL, MODELO_LABEL, SENIORIDADE_LABEL, STATUS_LABEL,
  TalentError, gerarPerfilVaga, salvarCargoNaBiblioteca, useSaveVaga,
  type Senioridade, type Vaga, type VagaInput,
} from "@/hooks/useVagas";

/**
 * Grade padrão sugerida a partir da senioridade da vaga.
 * Ponto único para, no futuro, aceitar um mapa próprio por empresa.
 * É só sugestão: o RH sempre pode sobrescrever o valor no formulário.
 */
const SENIORIDADE_GRADE_PADRAO: Record<Senioridade, string> = {
  junior: "I", pleno: "II", senior: "III", especialista: "IV", profissional: "V", consultor: "VI",
};

const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const AREA_FAMILIA: [RegExp, string][] = [
  [/advog|jurid|direito|legal/, "Jurídico"],
  [/financ|contab|fiscal/, "Financeiro"],
  [/\brh\b|recursos humanos|pessoas/, "Recursos Humanos"],
  [/\bti\b|tecnolog|sistemas|desenvolv/, "Tecnologia"],
  [/venda|comercial/, "Comercial"],
  [/marketing/, "Marketing"],
  [/operac|produc|logist/, "Operações"],
];

const empty: VagaInput = {
  titulo: "", area: "", senioridade: "pleno", cbo: "", descricao_cargo_id: null,
  responsabilidades: "", requisitos_obrigatorios: "", requisitos_desejaveis: "", competencias: [],
  faixa_salarial_min: null, faixa_salarial_max: null, modelo_trabalho: "presencial",
  localizacao: "", uf: "", cidade: "", tipo_contratacao: "clt", qtd_vagas: 1, observacao: "", status: "rascunho",
};

const OBS_MAX = 2000;

const bullets = (a: string[]) => a.map((s) => `• ${s}`).join("\n");

export const VagaDialog = ({ open, onOpenChange, vaga }: { open: boolean; onOpenChange: (o: boolean) => void; vaga?: Vaga | null }) => {
  const [f, setF] = useState<VagaInput>(empty);
  const [competenciasTxt, setCompetenciasTxt] = useState("");
  const [fromCbo, setFromCbo] = useState(false);
  const [salvarBiblioteca, setSalvarBiblioteca] = useState(false);
  const [familia, setFamilia] = useState("");
  const [nivel, setNivel] = useState("");
  const [familiaEditada, setFamiliaEditada] = useState(false);
  const [nivelEditado, setNivelEditado] = useState(false);
  const { activeCompanyId } = useCompanyContext();
  const { data: familias = [] } = useQuery({
    queryKey: ["job_families", activeCompanyId],
    enabled: open && !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("job_families").select("id, name")
        .eq("root_company_id", activeCompanyId!).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [gerando, setGerando] = useState(false);
  const [faixaEditada, setFaixaEditada] = useState(false);
  const [faixaSugerida, setFaixaSugerida] = useState(false);
  const [erroIa, setErroIa] = useState<{ msg: string; retry: boolean } | null>(null);
  const save = useSaveVaga();

  useEffect(() => {
    if (!open) return;
    const base = vaga ? { ...empty, ...vaga, uf: vaga.uf ?? "", cidade: vaga.cidade ?? "" } : empty;
    setF(base);
    setCompetenciasTxt((base.competencias ?? []).join(", "));
    setFromCbo(false); setSalvarBiblioteca(false); setFamilia(""); setNivel(SENIORIDADE_GRADE_PADRAO[base.senioridade]); setFamiliaEditada(false); setNivelEditado(false); setErroIa(null);
    // Vaga existente com faixa já salva: não sobrescrever.
    setFaixaEditada(!!vaga && (vaga.faixa_salarial_min != null || vaga.faixa_salarial_max != null)); setFaixaSugerida(false);
  }, [open, vaga]);

  const { data: sugestao } = useSugestaoFaixa({
    titulo: f.titulo, cbo: f.cbo ?? "", grade: salvarBiblioteca ? nivel : "", cargoId: f.descricao_cargo_id,
  });
  useEffect(() => {
    if (!open || faixaEditada) return;
    setF((p) => ({ ...p, faixa_salarial_min: sugestao?.min ?? null, faixa_salarial_max: sugestao?.max ?? null }));
    setFaixaSugerida(!!sugestao);
  }, [sugestao, faixaEditada, open]);

  // Sugestões automáticas (não sobrescrevem o que o RH editou)
  useEffect(() => {
    if (!nivelEditado) setNivel(SENIORIDADE_GRADE_PADRAO[f.senioridade]);
  }, [f.senioridade, nivelEditado]);
  useEffect(() => {
    if (familiaEditada) return;
    const alvo = norm(`${f.area ?? ""} ${f.titulo}`);
    const existente = familias.find((x) => alvo && alvo.includes(norm(x.name)));
    const sugerida = existente?.name ?? AREA_FAMILIA.find(([re]) => re.test(alvo))?.[1];
    if (sugerida) setFamilia(sugerida);
  }, [f.area, f.titulo, familias, familiaEditada]);

  const garantirFamilia = async (nome: string) => {
    const existente = familias.find((x) => norm(x.name) === norm(nome));
    if (existente) return existente.name;
    const buscar = async () => {
      const { data } = await supabase.from("job_families").select("name")
        .eq("root_company_id", activeCompanyId!).ilike("name", nome.trim());
      return data?.[0]?.name ?? null;
    };
    const atual = await buscar();
    if (atual) return atual;
    const { error } = await supabase.from("job_families").insert({ name: nome.trim(), root_company_id: activeCompanyId!, is_active: true });
    if (error) {
      // Conflito de unicidade (ex.: criação simultânea): reutiliza a família existente em vez de abortar o salvamento da vaga.
      if (error.code === "23505") {
        const reuse = await buscar();
        if (reuse) return reuse;
      }
      throw error;
    }
    return nome.trim();
  };

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
    if (!f.uf) { toast.error("Informe o estado (UF) da vaga."); return; }
    if (f.faixa_salarial_min != null && f.faixa_salarial_max != null && f.faixa_salarial_min > f.faixa_salarial_max) {
      toast.error("A faixa salarial mínima não pode ser maior que a máxima."); return;
    }
    const competencias = competenciasTxt.split(/[,\n]/).map((s) => s.replace(/^•\s*/, "").trim()).filter(Boolean);
    let input: VagaInput = { ...f, competencias };
    try {
      if (fromCbo && salvarBiblioteca) {
        const faltam = [!familia.trim() && "família do cargo", !nivel.trim() && "nível / grade"].filter(Boolean);
        if (faltam.length) { toast.error(`Informe ${faltam.join(" e ")} para cadastrar o cargo na biblioteca.`); return; }
        const familiaFinal = await garantirFamilia(familia);
        const r = await salvarCargoNaBiblioteca({
          title: f.titulo, cbo: f.cbo ?? "", jobFamily: familiaFinal, grade: nivel,
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
            <div className="space-y-1.5"><Label>Estado (UF) *</Label>
              <Select value={f.uf ?? ""} onValueChange={(v) => setF((p) => ({ ...p, uf: v, cidade: p.uf === v ? p.cidade : "" }))} disabled={busy}>
                <SelectTrigger className="rounded-xl" aria-label="Estado (UF)"><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                <SelectContent>{Object.entries(UFS).map(([k, v]) => <SelectItem key={k} value={k}>{k} — {v}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-1.5"><Label>Cidade</Label>
              <CidadeInput uf={f.uf ?? ""} value={f.cidade ?? ""} onChange={(v) => set("cidade", v)} disabled={busy} /></div>
            <Sel label="Tipo de contratação" value={f.tipo_contratacao} onChange={(v) => set("tipo_contratacao", v as VagaInput["tipo_contratacao"])} options={CONTRATACAO_LABEL} disabled={busy} />
            <div className="space-y-1.5"><Label>Faixa salarial mínima (R$)</Label>
              <Input type="number" min={0} value={f.faixa_salarial_min ?? ""} disabled={busy} onChange={(e) => { setFaixaEditada(true); set("faixa_salarial_min", numOrNull(e.target.value)); }} /></div>
            <div className="space-y-1.5"><Label>Faixa salarial máxima (R$)</Label>
              <Input type="number" min={0} value={f.faixa_salarial_max ?? ""} disabled={busy} onChange={(e) => { setFaixaEditada(true); set("faixa_salarial_max", numOrNull(e.target.value)); }} /></div>
            {faixaSugerida && !faixaEditada && (
              <p className="sm:col-span-2 -mt-2 text-xs text-muted-foreground">Sugestão baseada em pesquisa — ajuste se necessário.</p>
            )}
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

          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea value={f.observacao ?? ""} rows={3} maxLength={OBS_MAX} disabled={busy}
              placeholder="Anotações internas sobre o processo seletivo (visível só para o RH)"
              onChange={(e) => set("observacao", e.target.value)} className="rounded-xl" />
            <p className="text-xs text-muted-foreground text-right">{(f.observacao ?? "").length}/{OBS_MAX}</p>
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
                    <Input list="familias-cargo" value={familia} onChange={(e) => { setFamilia(e.target.value); setFamiliaEditada(true); }} maxLength={100} disabled={busy} placeholder="Escolha ou digite uma nova" />
                    <datalist id="familias-cargo">{familias.map((x) => <option key={x.id} value={x.name} />)}</datalist></div>
                  <div className="space-y-1.5"><Label>Nível / grade *</Label>
                    <Input value={nivel} onChange={(e) => { setNivel(e.target.value); setNivelEditado(true); }} maxLength={50} disabled={busy} /></div>
                  <p className="sm:col-span-2 text-xs text-muted-foreground">Sugestão automática — ajuste se necessário.</p>
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
