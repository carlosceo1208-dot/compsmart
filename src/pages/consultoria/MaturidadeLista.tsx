import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

export const STATUS_LABEL: Record<string, string> = { rascunho: "Rascunho", coletando: "Coletando", concluido: "Concluído" };

export const useMaturidadeEmpresas = () =>
  useQuery({
    queryKey: ["maturidade-empresas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("maturidade_empresas");
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string }[];
    },
  });

export default function MaturidadeLista() {
  const { data: papel, isLoading: carregandoPapel } = useCurrentUserRole();
  const interno = !!(papel?.isSuperAdmin || (papel as { isConsultor?: boolean } | undefined)?.isConsultor);
  const qc = useQueryClient();
  const empresas = useMaturidadeEmpresas();
  const [empresa, setEmpresa] = useState("");
  const [nome, setNome] = useState("");

  const lista = useQuery({
    queryKey: ["maturidade-diagnosticos"],
    enabled: interno,
    queryFn: async () => {
      const { data, error } = await supabase.from("maturidade_diagnosticos").select("*").order("criado_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("maturidade_diagnosticos").insert({ root_company_id: empresa, nome_projeto: nome.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setNome(""); qc.invalidateQueries({ queryKey: ["maturidade-diagnosticos"] }); toast({ title: "Diagnóstico criado" }); },
    onError: () => toast({ title: "Não foi possível criar", description: "Confira se você tem projeto ativo nesta empresa.", variant: "destructive" }),
  });

  if (carregandoPapel) return null;
  if (!interno) {
    return (
      <Card className="max-w-lg mx-auto mt-10"><CardContent className="p-6 flex gap-3"><ShieldAlert className="h-5 w-5 text-destructive" /><p>Área restrita à consultoria CompSmart.</p></CardContent></Card>
    );
  }

  const nomeEmpresa = (id: string) => empresas.data?.find((e) => e.id === id)?.nome ?? "—";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Diagnóstico de Maturidade do RH</h1>
        <p className="text-muted-foreground text-sm">Ferramenta interna da consultoria. O cliente não vê esta área.</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">Novo diagnóstico</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-1.5">
            <Label>Empresa</Label>
            <Select value={empresa} onValueChange={setEmpresa}>
              <SelectTrigger aria-label="Empresa"><SelectValue placeholder={empresas.data?.length === 0 ? "Nenhuma empresa com projeto ativo" : "Selecione"} /></SelectTrigger>
              <SelectContent>{empresas.data?.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="nome-proj">Nome do projeto</Label><Input id="nome-proj" maxLength={160} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maturidade RH 2026" /></div>
          <Button disabled={!empresa || nome.trim().length < 3 || criar.isPending} onClick={() => criar.mutate()}><Plus className="h-4 w-4 mr-1" /> Criar</Button>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {lista.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum diagnóstico ainda.</p>}
        {lista.data?.map((d) => (
          <Link key={d.id} to={`/consultoria/maturidade/${d.id}`}>
            <Card className="rounded-2xl hover:border-primary transition-colors">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div><p className="font-medium text-foreground">{d.nome_projeto}</p><p className="text-sm text-muted-foreground">{nomeEmpresa(d.root_company_id)} · {new Date(d.criado_em).toLocaleDateString("pt-BR")}</p></div>
                <Badge variant={d.status === "concluido" ? "default" : "secondary"} className="rounded-full">{STATUS_LABEL[d.status]}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
