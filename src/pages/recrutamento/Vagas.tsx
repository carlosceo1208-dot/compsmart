import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Users, Clock, MapPin } from "lucide-react";
import { VagaDialog } from "@/components/recrutamento/VagaDialog";
import { MODELO_LABEL, SENIORIDADE_LABEL, STATUS_LABEL, useVagas, type Vaga } from "@/hooks/useVagas";

const STATUS_VARIANT: Record<Vaga["status"], "default" | "secondary" | "outline" | "destructive"> = {
  publicada: "default", rascunho: "secondary", pausada: "outline", fechada: "destructive",
};

const diasAberta = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

const Vagas = () => {
  const { data: vagas = [], isLoading, error } = useVagas();
  const [status, setStatus] = useState("todos");
  const [area, setArea] = useState("todas");
  const [senioridade, setSenioridade] = useState("todas");
  const [editing, setEditing] = useState<Vaga | null>(null);
  const [open, setOpen] = useState(false);

  const areas = useMemo(() => Array.from(new Set(vagas.map((v) => v.area).filter(Boolean))) as string[], [vagas]);
  const lista = vagas.filter((v) =>
    (status === "todos" || v.status === status) &&
    (area === "todas" || v.area === area) &&
    (senioridade === "todas" || v.senioridade === senioridade));

  const abrir = (v: Vaga | null) => { setEditing(v); setOpen(true); };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-primary" /> Vagas
            </h1>
            <Badge className="rounded-full">Agente Talent</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Recrutamento & Seleção (Aquisição de talentos)</p>
        </div>
        <Button className="rounded-xl" onClick={() => abrir(null)}><Plus className="h-4 w-4 mr-2" />Nova vaga</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Filtro value={status} onChange={setStatus} placeholder="Status" all="Todos os status" allValue="todos" options={STATUS_LABEL} />
        <Filtro value={area} onChange={setArea} placeholder="Área" all="Todas as áreas" allValue="todas" options={Object.fromEntries(areas.map((a) => [a, a]))} />
        <Filtro value={senioridade} onChange={setSenioridade} placeholder="Senioridade" all="Todas as senioridades" allValue="todas" options={SENIORIDADE_LABEL} />
      </div>

      {error && <p className="text-destructive text-sm">Não foi possível carregar as vagas.</p>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : lista.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-12 text-center space-y-3">
          <p className="text-muted-foreground">{vagas.length === 0 ? "Nenhuma vaga cadastrada ainda." : "Nenhuma vaga com esses filtros."}</p>
          {vagas.length === 0 && <Button className="rounded-xl" onClick={() => abrir(null)}><Plus className="h-4 w-4 mr-2" />Criar primeira vaga</Button>}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((v) => (
            <Card key={v.id} role="button" tabIndex={0} onClick={() => abrir(v)} onKeyDown={(e) => e.key === "Enter" && abrir(v)}
              className="rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold leading-tight">{v.titulo}</p>
                    <p className="text-sm text-muted-foreground">{v.area || "Sem área"}{v.cbo ? ` · CBO ${v.cbo}` : ""}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[v.status]} className="rounded-full shrink-0">{STATUS_LABEL[v.status]}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="rounded-full">{SENIORIDADE_LABEL[v.senioridade]}</Badge>
                  <Badge variant="outline" className="rounded-full">{MODELO_LABEL[v.modelo_trabalho]}</Badge>
                  {v.qtd_vagas > 1 && <Badge variant="outline" className="rounded-full">{v.qtd_vagas} posições</Badge>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1 pt-2"><Users className="h-3.5 w-3.5" />0 candidatos</span>
                  <span className="flex items-center gap-1 pt-2"><MapPin className="h-3.5 w-3.5" />{v.status === "publicada" ? "Triagem" : "Abertura"}</span>
                  <span className="flex items-center gap-1 pt-2"><Clock className="h-3.5 w-3.5" />{diasAberta(v.created_at)} dias</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VagaDialog open={open} onOpenChange={setOpen} vaga={editing} />
    </div>
  );
};

const Filtro = ({ value, onChange, placeholder, all, allValue, options }: {
  value: string; onChange: (v: string) => void; placeholder: string; all: string; allValue: string; options: Record<string, string>;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="rounded-xl" aria-label={placeholder}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>
      <SelectItem value={allValue}>{all}</SelectItem>
      {Object.entries(options).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
    </SelectContent>
  </Select>
);

export default Vagas;
