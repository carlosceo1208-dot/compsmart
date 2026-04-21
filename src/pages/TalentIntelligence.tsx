import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, TrendingUp, AlertCircle, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import {
  useTalentIntelligenceDashboard,
  useGenerateTalentRecommendation,
  useUpdateRecommendationStatus,
  useTalentKPIs,
  BOX_LABELS,
  TalentIntelRow,
} from '@/hooks/useTalentIntelligence';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

const formatBRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0));

export default function TalentIntelligence() {
  const { data: role } = useCurrentUserRole();
  const allowed = role?.isAdmin || role?.isSuperAdmin || role?.isHR;

  const { data: rows = [], isLoading } = useTalentIntelligenceDashboard();
  const { data: kpis } = useTalentKPIs();
  const generate = useGenerateTalentRecommendation();
  const updateStatus = useUpdateRecommendationStatus();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !search ||
          r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          r.job_title?.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  if (!allowed) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Acesso restrito a Admin/RH.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 h-[calc(100vh-8rem)] overflow-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          Talent Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">
          Integração Performance × Remuneração — recomendações baseadas em 9Box (Bersin model)
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp} label="Star/High Potential" value={kpis?.stars ?? 0} variant="success" />
        <KpiCard icon={AlertCircle} label="Action Needed" value={kpis?.action ?? 0} variant="danger" />
        <KpiCard icon={DollarSign} label="Impacto Anual Estimado" value={formatBRL(kpis?.totalImpact)} />
        <KpiCard icon={CheckCircle2} label="Recomendações Pendentes" value={kpis?.pending ?? 0} variant="warning" />
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Matriz Performance × Remuneração</CardTitle>
          <Input
            placeholder="Buscar funcionário ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>9Box</TableHead>
                    <TableHead className="text-right">Salário</TableHead>
                    <TableHead className="text-right">Mérito Sug.</TableHead>
                    <TableHead className="text-right">Impacto Anual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <RowItem
                      key={r.employee_id}
                      row={r}
                      onGenerate={() => generate.mutate(r)}
                      onApprove={(id) => updateStatus.mutate({ id, status: 'approved' })}
                      onReject={(id) => updateStatus.mutate({ id, status: 'rejected' })}
                      onApply={(id) => updateStatus.mutate({ id, status: 'applied' })}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum funcionário com avaliação no período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  variant = 'default',
}: {
  icon: any;
  label: string;
  value: any;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const colorMap = {
    default: 'text-primary bg-primary/10',
    success: 'text-emerald-600 bg-emerald-500/10',
    danger: 'text-red-600 bg-red-500/10',
    warning: 'text-amber-600 bg-amber-500/10',
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorMap[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function RowItem({
  row,
  onGenerate,
  onApprove,
  onReject,
  onApply,
}: {
  row: TalentIntelRow;
  onGenerate: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onApply: (id: string) => void;
}) {
  const box = row.box_position ?? 0;
  const meta = BOX_LABELS[box];
  const status = row.recommendation_status;

  return (
    <TableRow>
      <TableCell className="font-medium">{row.full_name ?? '-'}</TableCell>
      <TableCell className="text-muted-foreground">{row.job_title ?? '-'}</TableCell>
      <TableCell>
        {box > 0 ? (
          <Badge className={`${meta?.color} text-white`}>
            {box} · {meta?.label}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Sem avaliação</span>
        )}
      </TableCell>
      <TableCell className="text-right">{formatBRL(row.current_salary)}</TableCell>
      <TableCell className="text-right">
        {row.suggested_merit_pct != null ? `${Number(row.suggested_merit_pct).toFixed(1)}%` : '-'}
      </TableCell>
      <TableCell className="text-right">
        {row.financial_impact_annual ? formatBRL(row.financial_impact_annual) : '-'}
      </TableCell>
      <TableCell>
        {status ? (
          <Badge variant={status === 'applied' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'}>
            {status}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right space-x-1">
        {!row.recommendation_id && box > 0 && (
          <Button size="sm" variant="outline" onClick={onGenerate}>
            <Sparkles className="h-3 w-3 mr-1" /> Gerar
          </Button>
        )}
        {row.recommendation_id && status === 'pending' && (
          <>
            <Button size="sm" variant="outline" onClick={() => onApprove(row.recommendation_id!)}>
              <CheckCircle2 className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onReject(row.recommendation_id!)}>
              <XCircle className="h-3 w-3" />
            </Button>
          </>
        )}
        {row.recommendation_id && status === 'approved' && (
          <Button size="sm" onClick={() => onApply(row.recommendation_id!)}>
            Aplicar
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
