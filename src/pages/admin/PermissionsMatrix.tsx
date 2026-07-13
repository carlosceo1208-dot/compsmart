import { useMemo, useState } from "react";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Check, Loader2, ShieldCheck, X, Search } from "lucide-react";

type Role = "anon" | "authenticated" | "employee" | "manager" | "hr_manager" | "admin" | "super_admin";
type Access = "full" | "read" | "own" | "none";

const ROLES: { key: Role; label: string }[] = [
  { key: "anon", label: "Anônimo" },
  { key: "authenticated", label: "Autenticado" },
  { key: "employee", label: "Colaborador" },
  { key: "manager", label: "Gestor" },
  { key: "hr_manager", label: "RH" },
  { key: "admin", label: "Admin" },
  { key: "super_admin", label: "Super Admin" },
];

type Row = {
  resource: string;
  scope: "público" | "tenant" | "próprio" | "global";
  action: string;
  access: Record<Role, Access>;
  notes?: string;
};

const MODULES: Record<string, Row[]> = {
  "Core — Remuneração": [
    {
      resource: "profiles",
      scope: "tenant",
      action: "Ler colaboradores",
      access: { anon: "none", authenticated: "own", employee: "own", manager: "read", hr_manager: "read", admin: "read", super_admin: "full" },
      notes: "Admin/RH restritos ao root_company_id.",
    },
    {
      resource: "salary_ranges",
      scope: "tenant",
      action: "Ver / editar faixas",
      access: { anon: "none", authenticated: "none", employee: "none", manager: "read", hr_manager: "full", admin: "full", super_admin: "full" },
    },
    {
      resource: "salary_tables",
      scope: "tenant",
      action: "Gerenciar tabelas",
      access: { anon: "none", authenticated: "none", employee: "none", manager: "none", hr_manager: "full", admin: "full", super_admin: "full" },
    },
    {
      resource: "benefits / employee_benefits",
      scope: "tenant",
      action: "Cadastrar e atribuir",
      access: { anon: "none", authenticated: "own", employee: "own", manager: "read", hr_manager: "full", admin: "full", super_admin: "full" },
    },
    {
      resource: "budget / budget_submissions",
      scope: "tenant",
      action: "Submeter / aprovar",
      access: { anon: "none", authenticated: "none", employee: "none", manager: "own", hr_manager: "full", admin: "full", super_admin: "full" },
    },
  ],
  "Performance & Talento": [
    {
      resource: "performance_evaluations",
      scope: "tenant",
      action: "Avaliar / consultar",
      access: { anon: "none", authenticated: "own", employee: "own", manager: "read", hr_manager: "full", admin: "full", super_admin: "full" },
    },
    {
      resource: "performance_succession",
      scope: "tenant",
      action: "9Box / sucessão",
      access: { anon: "none", authenticated: "none", employee: "none", manager: "read", hr_manager: "full", admin: "full", super_admin: "full" },
    },
    {
      resource: "executive_dashboard_indicators",
      scope: "global",
      action: "Ver indicadores executivos",
      access: { anon: "none", authenticated: "none", employee: "none", manager: "none", hr_manager: "none", admin: "none", super_admin: "full" },
    },
  ],
  "NR-1 & Bem-estar": [
    {
      resource: "nr1_diagnosticos",
      scope: "tenant",
      action: "Criar / ler diagnósticos",
      access: { anon: "none", authenticated: "none", employee: "own", manager: "read", hr_manager: "full", admin: "full", super_admin: "full" },
    },
    {
      resource: "nr1_jornadas / checkins",
      scope: "tenant",
      action: "Acompanhar jornada",
      access: { anon: "none", authenticated: "own", employee: "own", manager: "read", hr_manager: "full", admin: "full", super_admin: "full" },
    },
    {
      resource: "clima_pesquisas / respostas",
      scope: "tenant",
      action: "Responder / consolidar",
      access: { anon: "none", authenticated: "own", employee: "own", manager: "read", hr_manager: "full", admin: "full", super_admin: "full" },
      notes: "Respostas anônimas — nunca por autor.",
    },
    {
      resource: "nr1_leads",
      scope: "público",
      action: "Captura landing",
      access: { anon: "own", authenticated: "own", employee: "own", manager: "read", hr_manager: "read", admin: "read", super_admin: "full" },
    },
  ],
  "Administração & Segurança": [
    {
      resource: "user_roles",
      scope: "tenant",
      action: "Gerenciar papéis",
      access: { anon: "none", authenticated: "own", employee: "own", manager: "own", hr_manager: "read", admin: "full", super_admin: "full" },
    },
    {
      resource: "permissions",
      scope: "global",
      action: "Definir permissões",
      access: { anon: "none", authenticated: "none", employee: "none", manager: "none", hr_manager: "none", admin: "none", super_admin: "full" },
    },
    {
      resource: "audit_logs / auth_attempt_logs",
      scope: "tenant",
      action: "Auditar acesso",
      access: { anon: "none", authenticated: "none", employee: "none", manager: "none", hr_manager: "read", admin: "read", super_admin: "full" },
    },
    {
      resource: "organizational_structure",
      scope: "tenant",
      action: "Editar empresa / add-ons",
      access: { anon: "none", authenticated: "read", employee: "read", manager: "read", hr_manager: "read", admin: "read", super_admin: "full" },
      notes: "Somente super_admin muda flags de plano.",
    },
    {
      resource: "glossary_terms",
      scope: "global",
      action: "Gerenciar conteúdo do glossário",
      access: { anon: "read", authenticated: "read", employee: "read", manager: "read", hr_manager: "read", admin: "none", super_admin: "full" },
      notes: "Leitura pública; escrita restrita a super_admin.",
    },
    {
      resource: "support_quick_actions",
      scope: "global",
      action: "Editar atalhos de suporte",
      access: { anon: "none", authenticated: "read", employee: "read", manager: "read", hr_manager: "read", admin: "none", super_admin: "full" },
      notes: "Leitura autenticada; escrita restrita a super_admin.",
    },
    {
      resource: "cbo_codes",
      scope: "público",
      action: "Referência CBO",
      access: { anon: "read", authenticated: "read", employee: "read", manager: "read", hr_manager: "read", admin: "read", super_admin: "full" },
    },
  ],
  "Edge Functions críticas": [
    {
      resource: "send-kudos-notification",
      scope: "tenant",
      action: "Notificar reconhecimento",
      access: { anon: "none", authenticated: "own", employee: "own", manager: "own", hr_manager: "full", admin: "full", super_admin: "full" },
      notes: "Sender validado no server contra JWT.",
    },
    {
      resource: "notify-budget-submission",
      scope: "tenant",
      action: "Notificar aprovadores",
      access: { anon: "none", authenticated: "none", employee: "none", manager: "own", hr_manager: "full", admin: "full", super_admin: "full" },
    },
    {
      resource: "succession-ai-analysis",
      scope: "tenant",
      action: "IA de sucessão",
      access: { anon: "none", authenticated: "none", employee: "none", manager: "none", hr_manager: "full", admin: "full", super_admin: "full" },
    },
    {
      resource: "salary/legal/incentive-assistant",
      scope: "tenant",
      action: "Assistentes IA",
      access: { anon: "none", authenticated: "own", employee: "own", manager: "own", hr_manager: "own", admin: "own", super_admin: "full" },
      notes: "Documentos sanitizados (anti-prompt-injection).",
    },
    {
      resource: "invite-super-admin",
      scope: "global",
      action: "Convidar sócios",
      access: { anon: "none", authenticated: "none", employee: "none", manager: "none", hr_manager: "none", admin: "none", super_admin: "full" },
    },
  ],
};

function Cell({ v }: { v: Access }) {
  if (v === "full") return <Badge className="bg-emerald-600 hover:bg-emerald-600"><Check className="h-3 w-3 mr-1" />Total</Badge>;
  if (v === "read") return <Badge variant="secondary">Leitura</Badge>;
  if (v === "own") return <Badge variant="outline">Próprio</Badge>;
  return <Badge variant="outline" className="opacity-60"><X className="h-3 w-3 mr-1" />—</Badge>;
}

export default function PermissionsMatrix() {
  const role = useCurrentUserRole();
  const [query, setQuery] = useState("");
  const modules = useMemo(() => {
    if (!query.trim()) return MODULES;
    const q = query.toLowerCase();
    const out: Record<string, Row[]> = {};
    for (const [k, rows] of Object.entries(MODULES)) {
      const filtered = rows.filter(
        (r) =>
          r.resource.toLowerCase().includes(q) ||
          r.action.toLowerCase().includes(q) ||
          (r.notes ?? "").toLowerCase().includes(q)
      );
      if (filtered.length) out[k] = filtered;
    }
    return out;
  }, [query]);

  if (role.isLoading) {
    return (
      <div className="flex items-center gap-2 p-12 justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
      </div>
    );
  }
  if (!role.data?.isSuperAdmin) {
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto mt-12">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso restrito</AlertTitle>
        <AlertDescription>Somente Super Administradores podem consultar a matriz de permissões.</AlertDescription>
      </Alert>
    );
  }

  const tabs = Object.keys(modules);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Matriz de Permissões</CardTitle>
          </div>
          <CardDescription>
            Referência viva de quais perfis (e escopos de tenant) podem acessar cada módulo e ação crítica do
            CompSmart. Use para auditoria, onboarding de suporte e análise de conformidade LGPD.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por tabela, ação ou nota…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Badge className="bg-emerald-600 hover:bg-emerald-600">Total</Badge> escrita+leitura</span>
            <span className="inline-flex items-center gap-1"><Badge variant="secondary">Leitura</Badge> somente ler</span>
            <span className="inline-flex items-center gap-1"><Badge variant="outline">Próprio</Badge> apenas registros do usuário</span>
            <span className="inline-flex items-center gap-1"><Badge variant="outline" className="opacity-60">—</Badge> bloqueado</span>
          </div>
        </CardContent>
      </Card>

      {tabs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum resultado.</CardContent></Card>
      ) : (
        <Tabs defaultValue={tabs[0]}>
          <TabsList className="flex-wrap h-auto">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t} value={t}>
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Recurso</TableHead>
                        <TableHead>Escopo</TableHead>
                        <TableHead className="min-w-[180px]">Ação</TableHead>
                        {ROLES.map((r) => (
                          <TableHead key={r.key} className="text-center">{r.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules[t].map((row) => (
                        <TableRow key={row.resource + row.action}>
                          <TableCell>
                            <div className="font-mono text-xs">{row.resource}</div>
                            {row.notes && <div className="text-xs text-muted-foreground mt-1">{row.notes}</div>}
                          </TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{row.scope}</Badge></TableCell>
                          <TableCell className="text-sm">{row.action}</TableCell>
                          {ROLES.map((r) => (
                            <TableCell key={r.key} className="text-center"><Cell v={row.access[r.key]} /></TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
