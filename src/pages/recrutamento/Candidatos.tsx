import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ClipboardPaste, FileText, Loader2, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { useCandidatos, abrirCurriculo } from "@/hooks/useCandidatos";
import { useVagas } from "@/hooks/useVagas";
import { ETAPA_LABEL, FONTE_LABEL } from "@/config/recrutamento";
import { CandidatoDialog } from "@/components/recrutamento/CandidatoDialog";
import { ImportarCandidatosDialog } from "@/components/recrutamento/ImportarCandidatosDialog";

const Candidatos = () => {
  const { data: candidatos = [], isLoading, error } = useCandidatos();
  const { data: vagas = [] } = useVagas();
  const [busca, setBusca] = useState("");
  const [fonte, setFonte] = useState("todas");
  const [etapa, setEtapa] = useState("todas");
  const [vaga, setVaga] = useState("todas");
  const [novo, setNovo] = useState(false);
  const [importar, setImportar] = useState(false);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return candidatos.filter((c) =>
      (!q || c.nome.toLowerCase().includes(q) || c.email.includes(q)) &&
      (fonte === "todas" || c.fonte === fonte) &&
      (etapa === "todas" || c.candidaturas.some((x) => x.etapa === etapa)) &&
      (vaga === "todas" || c.candidaturas.some((x) => x.vaga_id === vaga)));
  }, [candidatos, busca, fonte, etapa, vaga]);

  const [abrindo, setAbrindo] = useState<string | null>(null);
  const verCurriculo = async (id: string, nome: string) => {
    setAbrindo(id);
    try { await abrirCurriculo(id, nome); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Link expirado. Tente abrir novamente."); }
    finally { setAbrindo(null); }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Link to="/recrutamento/vagas" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Vagas</Link>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 mt-1"><Users className="h-7 w-7 text-primary" /> Candidatos</h1>
          <p className="text-muted-foreground mt-1">Recrutamento & Seleção (Aquisição de Talentos)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setImportar(true)}><ClipboardPaste className="h-4 w-4 mr-2" />Colar da planilha</Button>
          <Button className="rounded-xl" onClick={() => setNovo(true)}><Plus className="h-4 w-4 mr-2" />Novo candidato</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" className="pl-9 rounded-xl" aria-label="Buscar candidato" />
        </div>
        <Filtro value={fonte} onChange={setFonte} label="Origem" all="Todas as origens" options={FONTE_LABEL} />
        <Filtro value={etapa} onChange={setEtapa} label="Etapa" all="Todas as etapas" options={ETAPA_LABEL} />
        <Filtro value={vaga} onChange={setVaga} label="Vaga" all="Todas as vagas" options={Object.fromEntries(vagas.map((v) => [v.id, v.titulo]))} />
      </div>

      {error && <p className="text-destructive text-sm">Não foi possível carregar os candidatos.</p>}

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : lista.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">
          {candidatos.length === 0 ? "Nenhum candidato ainda. Cadastre, cole da planilha ou divulgue o link de uma vaga publicada." : "Nenhum candidato com esses filtros."}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {lista.map((c) => (
            <Card key={c.id} className="rounded-2xl shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.nome}</p>
                    <p className="text-sm text-muted-foreground truncate">{c.email}{c.telefone ? ` · ${c.telefone}` : ""}</p>
                  </div>
                  <Badge variant={c.fonte === "portal" ? "default" : "secondary"} className="rounded-full shrink-0">{FONTE_LABEL[c.fonte]}</Badge>
                </div>
                {c.cargo_pretendido && <p className="text-sm">{c.cargo_pretendido}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {c.candidaturas.length === 0 ? <span className="text-xs text-muted-foreground">Sem vaga vinculada</span> :
                    c.candidaturas.map((x) => <Badge key={x.id} variant="outline" className="rounded-full">{x.vagas?.titulo ?? "Vaga"} · {ETAPA_LABEL[x.etapa]}</Badge>)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>{c.consentimento_lgpd ? `Aceite LGPD ${c.consentimento_versao ?? ""} em ${new Date(c.consentimento_data!).toLocaleDateString("pt-BR")}` : "Cadastrado pelo RH"}</span>
                  {c.curriculo_url && <Button size="sm" variant="ghost" className="h-7" disabled={abrindo === c.id} onClick={() => verCurriculo(c.id, c.nome)}>{abrindo === c.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-1" />}Currículo</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CandidatoDialog open={novo} onOpenChange={setNovo} />
      <ImportarCandidatosDialog open={importar} onOpenChange={setImportar} />
    </div>
  );
};

const Filtro = ({ value, onChange, label, all, options }: { value: string; onChange: (v: string) => void; label: string; all: string; options: Record<string, string> }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="rounded-xl" aria-label={label}><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="todas">{all}</SelectItem>
      {Object.entries(options).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
    </SelectContent>
  </Select>
);

export default Candidatos;
