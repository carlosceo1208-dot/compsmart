import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Users, CheckCircle2, AlertCircle, Search, X } from 'lucide-react';

type Linha = {
  id: string;
  full_name: string | null;
  email: string | null;
  employee_number: string | null;
  status: string | null;
  job_title: string | null;
  grade: string | null;
};

export default function Nr1Universo() {
  const { activeCompanyId, activeCompany } = useCompanyContext();

  const { data, isLoading } = useQuery({
    queryKey: ['nr1-universo', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      // Conta total na empresa (todos status, com ou sem employee_number)
      const totalRes = await (supabase as any)
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('root_company_id', activeCompanyId);

      // Lista quem entra no universo NR-1 (active + employee_number)
      const validosRes = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email, employee_number, status, job_title, grade')
        .eq('root_company_id', activeCompanyId)
        .eq('status', 'active')
        .not('employee_number', 'is', null)
        .order('full_name', { ascending: true });

      // Excluídos: na empresa, mas faltando algum critério
      const excluidosRes = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email, employee_number, status, job_title, grade')
        .eq('root_company_id', activeCompanyId)
        .or('status.neq.active,employee_number.is.null')
        .order('full_name', { ascending: true });

      return {
        total: Number(totalRes.count ?? 0),
        validos: (validosRes.data ?? []) as Linha[],
        excluidos: (excluidosRes.data ?? []) as Linha[],
      };
    },
  });

  // ----- Filtros (hooks devem vir antes de qualquer return) -----
  const [busca, setBusca] = useState('');
  const [gradeFiltro, setGradeFiltro] = useState<string>('todos');

  const validos = data?.validos ?? [];
  const excluidos = data?.excluidos ?? [];
  const total = data?.total ?? 0;

  const grades = useMemo(() => {
    const s = new Set<string>();
    validos.forEach((p) => p.grade && s.add(p.grade));
    return Array.from(s).sort();
  }, [validos]);

  const validosFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return validos.filter((p) => {
      if (gradeFiltro !== 'todos' && (p.grade ?? '') !== gradeFiltro) return false;
      if (!term) return true;
      const blob = `${p.full_name ?? ''} ${p.email ?? ''} ${p.employee_number ?? ''} ${p.job_title ?? ''}`.toLowerCase();
      return blob.includes(term);
    });
  }, [validos, busca, gradeFiltro]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando universo de colaboradores…
      </div>
    );
  }

  const limpar = () => { setBusca(''); setGradeFiltro('todos'); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="h-6 w-6 nr1-text-primary" />
          Universo de Colaboradores
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Empresa selecionada: <strong>{activeCompany?.name ?? '—'}</strong>. Estes são os colaboradores
          considerados pelo módulo NR-1 nos cálculos de respondentes e adesão.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="nr1-card-elevated">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total na base</p>
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground mt-1">Todos os perfis vinculados à empresa</p>
          </CardContent>
        </Card>
        <Card className="nr1-card-elevated">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Universo NR-1</p>
            <p className="text-3xl font-bold nr1-text-primary">{validos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <code>status = active</code> e <code>employee_number</code> preenchido
            </p>
          </CardContent>
        </Card>
        <Card className="nr1-card-elevated">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Excluídos</p>
            <p className="text-3xl font-bold text-amber-600">{excluidos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Inativos ou sem matrícula</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Colaboradores incluídos ({validosFiltrados.length}{validosFiltrados.length !== validos.length ? ` de ${validos.length}` : ''})
          </CardTitle>
          <CardDescription>Base de cálculo da adesão nos diagnósticos NR-1.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, matrícula, e-mail ou cargo…"
                className="pl-9"
              />
            </div>
            <Select value={gradeFiltro} onValueChange={setGradeFiltro}>
              <SelectTrigger className="md:w-[180px]"><SelectValue placeholder="Grade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as grades</SelectItem>
                {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            {(busca || gradeFiltro !== 'todos') && (
              <Button variant="ghost" size="sm" onClick={limpar}>
                <X className="h-4 w-4 mr-1" /> Limpar
              </Button>
            )}
          </div>

          {validosFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum colaborador encontrado com esses filtros.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validosFiltrados.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{p.full_name ?? p.email ?? '—'}</TableCell>
                    <TableCell><code className="text-xs">{p.employee_number}</code></TableCell>
                    <TableCell>{p.job_title ?? '—'}</TableCell>
                    <TableCell>{p.grade ?? '—'}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {excluidos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Excluídos do universo ({excluidos.length})
            </CardTitle>
            <CardDescription>Não entram nos cálculos — corrija status/matrícula se necessário.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {excluidos.map((p) => {
                  const motivos: string[] = [];
                  if (p.status !== 'active') motivos.push(`status=${p.status ?? '∅'}`);
                  if (!p.employee_number) motivos.push('sem matrícula');
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.full_name ?? p.email ?? '—'}</TableCell>
                      <TableCell>{p.employee_number ? <code className="text-xs">{p.employee_number}</code> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell><Badge variant="outline">{p.status ?? '—'}</Badge></TableCell>
                      <TableCell className="text-xs text-amber-700">{motivos.join(' · ')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
