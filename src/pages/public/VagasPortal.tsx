import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, Search } from "lucide-react";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getSeoRoute } from "@/config/seoRoutes";
import { UFS, formatLocal } from "@/lib/brasil";
import { MODELO_LABEL, SENIORIDADE_LABEL } from "@/hooks/useVagas";

export interface VagaPortal {
  slug: string; titulo: string; area: string | null; senioridade: string; modelo_trabalho: string;
  tipo_contratacao: string; cidade: string | null; uf: string | null;
  faixa_salarial_min: number | null; faixa_salarial_max: number | null; empresa: string; publicada_em: string;
}

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const formatFaixa = (min: number | null, max: number | null) =>
  min != null && max != null ? `${brl(min)} – ${brl(max)}` : min != null ? `A partir de ${brl(min)}` : max != null ? `Até ${brl(max)}` : null;

const VagasPortal = () => {
  const seo = getSeoRoute("/vagas")!;
  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState("todas");
  const [modelo, setModelo] = useState("todos");
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["portal-vagas"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("portal_listar_vagas");
      if (error) throw error;
      return (data ?? []) as VagaPortal[];
    },
  });
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return data.filter((v) => (!q || v.titulo.toLowerCase().includes(q) || (v.area ?? "").toLowerCase().includes(q)) &&
      (uf === "todas" || v.uf === uf) && (modelo === "todos" || v.modelo_trabalho === modelo));
  }, [data, busca, uf, modelo]);

  return (
    <PublicLayout path="/vagas" title={seo.title} description={seo.description}>
      <section className="container mx-auto px-4 py-10 sm:py-14 space-y-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold">Vagas abertas</h1>
          <p className="text-muted-foreground mt-2">Oportunidades publicadas pelas empresas que usam a CompSmart. Candidate-se em poucos minutos.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por cargo ou área" className="pl-9 rounded-xl" aria-label="Buscar vaga" />
          </div>
          <Select value={uf} onValueChange={setUf}>
            <SelectTrigger className="rounded-xl" aria-label="Estado"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todas">Todos os estados</SelectItem>
              {Object.entries(UFS).map(([k, v]) => <SelectItem key={k} value={k}>{k} — {v}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={modelo} onValueChange={setModelo}>
            <SelectTrigger className="rounded-xl" aria-label="Modelo de trabalho"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todos os modelos</SelectItem>
              {Object.entries(MODELO_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {error && <p className="text-destructive text-sm">Não foi possível carregar as vagas agora. Tente novamente em instantes.</p>}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
        ) : lista.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="py-14 text-center text-muted-foreground">
            {data.length === 0 ? "No momento não há vagas abertas. Volte em breve." : "Nenhuma vaga com esses filtros."}
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lista.map((v) => {
              const faixa = formatFaixa(v.faixa_salarial_min, v.faixa_salarial_max);
              return (
                <Link key={v.slug} to={`/vagas/${v.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
                  <Card className="rounded-2xl h-full shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 space-y-2">
                      <p className="text-sm text-muted-foreground">{v.empresa}</p>
                      <h2 className="text-lg font-semibold">{v.titulo}</h2>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{formatLocal(v.cidade, v.uf)}</span>
                        <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{MODELO_LABEL[v.modelo_trabalho as keyof typeof MODELO_LABEL] ?? v.modelo_trabalho}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="secondary" className="rounded-full">{SENIORIDADE_LABEL[v.senioridade as keyof typeof SENIORIDADE_LABEL] ?? v.senioridade}</Badge>
                        {faixa && <Badge variant="outline" className="rounded-full">{faixa}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export default VagasPortal;
