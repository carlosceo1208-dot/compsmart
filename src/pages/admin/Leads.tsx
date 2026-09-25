import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Mail, Search } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useMFAStatus } from "@/hooks/useMFAStatus";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  normalizeStatus,
  origemLabel,
  useAdminLeads,
  useUpdateLeadStatus,
  type LeadStatus,
} from "@/hooks/useAdminLeads";
import { exportToCSV } from "@/lib/csvExport";
import { formatDateTimePtBR } from "@/lib/formatDateTime";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Lead = NonNullable<ReturnType<typeof useAdminLeads>["data"]>[number];

const statusVariant: Record<LeadStatus, "default" | "secondary" | "outline" | "destructive"> = {
  novo: "default",
  em_contato: "secondary",
  convertido: "outline",
  descartado: "destructive",
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm break-words">{value || "—"}</p>
  </div>
);

export default function Leads() {
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useCurrentUserRole();
  const { hasMFA, isLoading: mfaLoading } = useMFAStatus();
  const { data: leads = [], isLoading } = useAdminLeads();
  const update = useUpdateLeadStatus();
  const [q, setQ] = useState("");
  const [origem, setOrigem] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);

  useEffect(() => {
    if (roleLoading) return;
    if (!role?.isSuperAdmin) navigate("/dashboard");
    else if (!mfaLoading && !hasMFA) navigate("/auth/mfa-required");
  }, [role, roleLoading, hasMFA, mfaLoading, navigate]);

  const origens = useMemo(
    () => Array.from(new Set(leads.map((l) => l.origem).filter(Boolean))) as string[],
    [leads],
  );

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { novo: 0, em_contato: 0, convertido: 0, descartado: 0 };
    leads.forEach((l) => c[normalizeStatus(l.status)]++);
    return c;
  }, [leads]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (origem !== "all" && l.origem !== origem) return false;
      if (status !== "all" && normalizeStatus(l.status) !== status) return false;
      if (!term) return true;
      return [l.nome, l.email, l.empresa].some((v) => v?.toLowerCase().includes(term));
    });
  }, [leads, q, origem, status]);

  const setLeadStatus = async (lead: Lead, s: LeadStatus) => {
    try {
      await update.mutateAsync({ id: lead.id, status: s });
      setSelected((cur) => (cur?.id === lead.id ? { ...cur, status: s } : cur));
    } catch {
      toast.error("Não foi possível atualizar o status.");
    }
  };

  const reply = (lead: Lead) => {
    const subject = encodeURIComponent("CompSmart — retorno sobre seu contato");
    const body = encodeURIComponent(`Olá, ${lead.nome},\n\n`);
    window.location.href = `mailto:${encodeURIComponent(lead.email)}?subject=${subject}&body=${body}`;
    // Otimista: mailto não confirma envio.
    if (normalizeStatus(lead.status) === "novo") setLeadStatus(lead, "em_contato");
  };

  const exportCsv = () =>
    exportToCSV(
      `leads-${new Date().toISOString().slice(0, 10)}`,
      [
        { header: "Data", accessor: (l: Lead) => formatDateTimePtBR(l.created_at) },
        { header: "Nome", accessor: (l) => l.nome },
        { header: "E-mail", accessor: (l) => l.email },
        { header: "Empresa", accessor: (l) => l.empresa },
        { header: "Cargo", accessor: (l) => l.cargo },
        { header: "Porte", accessor: (l) => l.porte },
        { header: "Origem", accessor: (l) => origemLabel(l.origem) },
        { header: "Status", accessor: (l) => LEAD_STATUS_LABEL[normalizeStatus(l.status)] },
        { header: "Mensagem/Especialidade", accessor: (l) => l.especialidade },
        { header: "LinkedIn", accessor: (l) => l.linkedin },
        { header: "Consentimento LGPD", accessor: (l) => (l.consentimento_lgpd ? "Sim" : "Não") },
      ],
      filtered,
    );

  if (roleLoading || !role?.isSuperAdmin) {
    return <div className="p-6"><Skeleton className="h-8 w-64" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">Contatos recebidos pelos formulários do site.</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {LEAD_STATUSES.map((s) => (
          <Card key={s} className="rounded-2xl cursor-pointer" onClick={() => setStatus(status === s ? "all" : s)}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{LEAD_STATUS_LABEL[s]}</p>
              <p className="text-2xl font-semibold">{counts[s]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, e-mail ou empresa" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={origem} onValueChange={setOrigem}>
          <SelectTrigger className="md:w-56"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {origens.map((o) => <SelectItem key={o} value={o}>{origemLabel(o)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{LEAD_STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="hidden md:table-cell">Empresa</TableHead>
              <TableHead className="hidden lg:table-cell">Cargo</TableHead>
              <TableHead className="hidden lg:table-cell">Porte</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum lead encontrado.</TableCell></TableRow>
            ) : (
              filtered.map((l) => {
                const s = normalizeStatus(l.status);
                return (
                  <TableRow key={l.id} className="cursor-pointer" onClick={() => setSelected(l)}>
                    <TableCell className="whitespace-nowrap">{formatDateTimePtBR(l.created_at)}</TableCell>
                    <TableCell className="font-medium">{l.nome}</TableCell>
                    <TableCell>{l.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{l.empresa || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{l.cargo || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{l.porte || "—"}</TableCell>
                    <TableCell>{origemLabel(l.origem)}</TableCell>
                    <TableCell><Badge variant={statusVariant[s]} className="rounded-full">{LEAD_STATUS_LABEL[s]}</Badge></TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader><SheetTitle>{selected.nome}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <Field label="E-mail" value={selected.email} />
                <Field label="Recebido em" value={formatDateTimePtBR(selected.created_at)} />
                <Field label="Origem" value={origemLabel(selected.origem)} />
                <Field label="Empresa" value={selected.empresa} />
                <Field label="Cargo" value={selected.cargo} />
                <Field label="Porte" value={selected.porte} />
                <Field label="Módulo de interesse" value={selected.modulo_interesse} />
                <Field label="E-book / material" value={selected.lead_magnet} />
                <Field label="Tipo de parceria" value={selected.parceria_tipo} />
                <Field label="Mensagem / especialidade" value={selected.especialidade} />
                <Field label="LinkedIn" value={selected.linkedin} />
                <Field label="Consentimento LGPD" value={selected.consentimento_lgpd ? "Sim" : "Não"} />
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Select value={normalizeStatus(selected.status)} onValueChange={(v) => setLeadStatus(selected, v as LeadStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{LEAD_STATUS_LABEL[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => reply(selected)}>
                  <Mail className="h-4 w-4 mr-2" /> Responder por e-mail
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
