import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, Download, Filter, Lock, Activity, LogIn, Database } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

interface Filters {
  startDate: string;
  endDate: string;
  userEmail: string;
  companyId: string;
}

const initial = (): Filters => ({
  startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  userEmail: '',
  companyId: '',
});

const Nr1Auditoria = () => {
  const { data: role, isLoading: loadingRole } = useCurrentUserRole();
  const { activeCompanyId } = useCompanyContext();
  const [filters, setFilters] = useState<Filters>(initial);
  const [applied, setApplied] = useState<Filters>(initial);

  const canAccess = !!role && (role.isSuperAdmin || role.isAdmin || role.isHR);
  const scopedCompanyId = role?.isSuperAdmin ? (applied.companyId || null) : (activeCompanyId || null);

  const { data: userIdFilter } = useQuery({
    queryKey: ['audit-user-lookup', applied.userEmail],
    enabled: !!applied.userEmail,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', `%${applied.userEmail}%`)
        .limit(1)
        .maybeSingle();
      return data?.id ?? null;
    },
  });

  const dateRange = { from: `${applied.startDate}T00:00:00Z`, to: `${applied.endDate}T23:59:59Z` };

  const { data: accessLogs, isLoading: loadingAccess } = useQuery({
    queryKey: ['nr1-audit-access', applied, scopedCompanyId, userIdFilter],
    enabled: canAccess,
    queryFn: async () => {
      let q = supabase
        .from('nr1_access_log')
        .select('id, created_at, actor_user_id, actor_role, action, resource, blocked, reason, k_value, ip, user_agent, company_id')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
        .order('created_at', { ascending: false })
        .limit(500);
      if (scopedCompanyId) q = q.eq('company_id', scopedCompanyId);
      if (userIdFilter) q = q.eq('actor_user_id', userIdFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: authLogs, isLoading: loadingAuth } = useQuery({
    queryKey: ['nr1-audit-auth', applied, scopedCompanyId, userIdFilter],
    enabled: canAccess,
    queryFn: async () => {
      let q = supabase
        .from('auth_attempt_logs')
        .select('id, created_at, email, user_id, attempt_type, success, failure_reason, ip_address, company_id')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
        .order('created_at', { ascending: false })
        .limit(500);
      if (scopedCompanyId) q = q.eq('company_id', scopedCompanyId);
      if (applied.userEmail) q = q.ilike('email', `%${applied.userEmail}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: activityLogs, isLoading: loadingActivity } = useQuery({
    queryKey: ['nr1-audit-activity', applied, scopedCompanyId, userIdFilter],
    enabled: canAccess,
    queryFn: async () => {
      let q = supabase
        .from('usage_events')
        .select('id, created_at, user_id, company_id, event_name, event_category, module_name, route_path, duration_ms')
        .eq('module_name', 'nr1')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
        .order('created_at', { ascending: false })
        .limit(500);
      if (scopedCompanyId) q = q.eq('company_id', scopedCompanyId);
      if (userIdFilter) q = q.eq('user_id', userIdFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: dbAudit, isLoading: loadingDb } = useQuery({
    queryKey: ['nr1-audit-db', applied, scopedCompanyId, userIdFilter],
    enabled: canAccess,
    queryFn: async () => {
      let q = supabase
        .from('audit_logs')
        .select('id, created_at, user_id, action, table_name, record_id, root_company_id')
        .like('table_name', 'nr1_%')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)
        .order('created_at', { ascending: false })
        .limit(500);
      if (scopedCompanyId) q = q.eq('root_company_id', scopedCompanyId);
      if (userIdFilter) q = q.eq('user_id', userIdFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const kpis = useMemo(() => {
    const blocked = accessLogs?.filter((l) => l.blocked).length ?? 0;
    const totalAccess = accessLogs?.length ?? 0;
    const failedAuth = authLogs?.filter((l) => !l.success).length ?? 0;
    const activityCount = activityLogs?.length ?? 0;
    return { blocked, totalAccess, failedAuth, activityCount };
  }, [accessLogs, authLogs, activityLogs]);

  const exportCsv = (rows: any[], name: string) => {
    if (!rows?.length) return toast.error('Sem dados para exportar');
    const cols = Object.keys(rows[0]);
    const csv = [
      cols.join(','),
      ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingRole) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;
  }

  if (!canAccess) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>Auditoria NR-1 disponível apenas para RH, Admin e Super Admin.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="nr1-scope p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-primary" /> Auditoria NR-1</h1>
          <p className="text-sm text-muted-foreground">Logs de segurança, autenticação e atividades do Módulo NR-1, por usuário e por empresa.</p>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" /> Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div><Label>Início</Label><Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} /></div>
          <div><Label>Fim</Label><Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} /></div>
          <div><Label>E-mail do usuário</Label><Input placeholder="usuario@empresa.com" value={filters.userEmail} onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })} /></div>
          {role?.isSuperAdmin && (
            <div><Label>Empresa (ID)</Label><Input placeholder="uuid da empresa" value={filters.companyId} onChange={(e) => setFilters({ ...filters, companyId: e.target.value })} /></div>
          )}
          <div className="flex items-end gap-2">
            <Button onClick={() => setApplied(filters)} className="w-full">Aplicar</Button>
            <Button variant="outline" onClick={() => { setFilters(initial()); setApplied(initial()); }}>Limpar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<Lock className="h-4 w-4" />} label="Acessos bloqueados" value={kpis.blocked} tone="danger" />
        <KpiCard icon={<ShieldAlert className="h-4 w-4" />} label="Total de acessos NR-1" value={kpis.totalAccess} />
        <KpiCard icon={<LogIn className="h-4 w-4" />} label="Falhas de autenticação" value={kpis.failedAuth} tone={kpis.failedAuth > 0 ? 'warn' : undefined} />
        <KpiCard icon={<Activity className="h-4 w-4" />} label="Eventos de atividade" value={kpis.activityCount} />
      </div>

      <Tabs defaultValue="access">
        <TabsList className="flex-wrap">
          <TabsTrigger value="access">Acessos NR-1</TabsTrigger>
          <TabsTrigger value="auth">Autenticação</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
          <TabsTrigger value="db">Alterações de dados</TabsTrigger>
        </TabsList>

        <TabsContent value="access">
          <SectionCard title="Acessos ao Módulo NR-1" desc="Consultas, exportações, bloqueios por k-anonimato e sensibilidade." loading={loadingAccess} onExport={() => exportCsv(accessLogs ?? [], 'nr1-access-log')}>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Quando</TableHead><TableHead>Ator</TableHead><TableHead>Ação</TableHead><TableHead>Recurso</TableHead><TableHead>Bloqueado</TableHead><TableHead>k</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {accessLogs?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{format(new Date(r.created_at), 'dd/MM/yy HH:mm')}</TableCell>
                    <TableCell className="text-xs"><div>{r.actor_user_id?.slice(0, 8)}</div><Badge variant="outline" className="mt-1">{r.actor_role}</Badge></TableCell>
                    <TableCell className="text-xs">{r.action}</TableCell>
                    <TableCell className="text-xs">{r.resource}</TableCell>
                    <TableCell>{r.blocked ? <Badge variant="destructive">Sim — {r.reason}</Badge> : <Badge variant="secondary">Não</Badge>}</TableCell>
                    <TableCell className="text-xs">{r.k_value ?? '—'}</TableCell>
                  </TableRow>
                ))}
                {!accessLogs?.length && !loadingAccess && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Nenhum registro.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="auth">
          <SectionCard title="Tentativas de autenticação" desc="Login, MFA e recuperação de senha." loading={loadingAuth} onExport={() => exportCsv(authLogs ?? [], 'nr1-auth-log')}>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Quando</TableHead><TableHead>Email</TableHead><TableHead>Tipo</TableHead><TableHead>Sucesso</TableHead><TableHead>Motivo</TableHead><TableHead>IP</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {authLogs?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{format(new Date(r.created_at), 'dd/MM/yy HH:mm')}</TableCell>
                    <TableCell className="text-xs">{r.email}</TableCell>
                    <TableCell className="text-xs">{r.attempt_type}</TableCell>
                    <TableCell>{r.success ? <Badge variant="secondary">OK</Badge> : <Badge variant="destructive">Falha</Badge>}</TableCell>
                    <TableCell className="text-xs">{r.failure_reason ?? '—'}</TableCell>
                    <TableCell className="text-xs">{r.ip_address ?? '—'}</TableCell>
                  </TableRow>
                ))}
                {!authLogs?.length && !loadingAuth && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Nenhum registro.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="activity">
          <SectionCard title="Atividade do usuário no NR-1" desc="Page views, ações e uso de features." loading={loadingActivity} onExport={() => exportCsv(activityLogs ?? [], 'nr1-activity')}>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Quando</TableHead><TableHead>Usuário</TableHead><TableHead>Evento</TableHead><TableHead>Categoria</TableHead><TableHead>Rota</TableHead><TableHead>Duração</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {activityLogs?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{format(new Date(r.created_at), 'dd/MM/yy HH:mm')}</TableCell>
                    <TableCell className="text-xs">{r.user_id?.slice(0, 8) ?? '—'}</TableCell>
                    <TableCell className="text-xs">{r.event_name}</TableCell>
                    <TableCell className="text-xs">{r.event_category ?? '—'}</TableCell>
                    <TableCell className="text-xs">{r.route_path ?? '—'}</TableCell>
                    <TableCell className="text-xs">{r.duration_ms ? `${r.duration_ms}ms` : '—'}</TableCell>
                  </TableRow>
                ))}
                {!activityLogs?.length && !loadingActivity && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Nenhum registro.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="db">
          <SectionCard title="Alterações em dados NR-1" desc="Insert/Update/Delete em tabelas nr1_*." loading={loadingDb} onExport={() => exportCsv(dbAudit ?? [], 'nr1-db-audit')}>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Quando</TableHead><TableHead>Usuário</TableHead><TableHead>Ação</TableHead><TableHead>Tabela</TableHead><TableHead>Registro</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {dbAudit?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{format(new Date(r.created_at), 'dd/MM/yy HH:mm')}</TableCell>
                    <TableCell className="text-xs">{r.user_id?.slice(0, 8) ?? '—'}</TableCell>
                    <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                    <TableCell className="text-xs">{r.table_name}</TableCell>
                    <TableCell className="text-xs">{r.record_id?.slice(0, 8) ?? '—'}</TableCell>
                  </TableRow>
                ))}
                {!dbAudit?.length && !loadingDb && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Nenhum registro.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const KpiCard = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: 'danger' | 'warn' }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">{icon} {label}</span>
      </div>
      <div className={`text-2xl font-bold mt-1 ${tone === 'danger' ? 'text-destructive' : tone === 'warn' ? 'text-orange-500' : ''}`}>{value}</div>
    </CardContent>
  </Card>
);

const SectionCard = ({ title, desc, loading, onExport, children }: { title: string; desc: string; loading: boolean; onExport: () => void; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex-row items-center justify-between space-y-0">
      <div>
        <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> {title}</CardTitle>
        <CardDescription className="text-xs">{desc}</CardDescription>
      </div>
      <Button size="sm" variant="outline" onClick={onExport}><Download className="h-3 w-3 mr-1" /> CSV</Button>
    </CardHeader>
    <CardContent>{loading ? <Skeleton className="h-40" /> : children}</CardContent>
  </Card>
);

export default Nr1Auditoria;
