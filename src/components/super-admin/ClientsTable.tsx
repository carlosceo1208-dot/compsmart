import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Building2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Company {
  id: string;
  name: string;
  fantasy_name: string | null;
  industry_sector: string | null;
  subscription_status: string | null;
  plan_name: string | null;
  employee_count: number;
  avg_tenure_months: number;
  created_at: string;
  logo_url: string | null;
}

interface ClientsTableProps {
  companies: Company[];
  isLoading: boolean;
}

const formatTenure = (months: number): string => {
  if (months === 0) return '-';
  if (months < 12) return `${Math.round(months)}m`;
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  if (remainingMonths === 0) return `${years}a`;
  return `${years}a ${remainingMonths}m`;
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativo</Badge>;
    case 'trial':
      return <Badge variant="outline" className="border-amber-500 text-amber-500">Trial</Badge>;
    case 'canceled':
      return <Badge variant="destructive">Cancelado</Badge>;
    case 'expired':
      return <Badge variant="secondary">Expirado</Badge>;
    default:
      return <Badge variant="secondary">-</Badge>;
  }
};

const getSizeBadge = (count: number) => {
  if (count >= 500) return <Badge variant="outline" className="text-xs">GE</Badge>;
  if (count >= 100) return <Badge variant="outline" className="text-xs">ME</Badge>;
  return <Badge variant="outline" className="text-xs">PE</Badge>;
};

export const ClientsTable = ({ companies, isLoading }: ClientsTableProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (isLoading) {
    return <Skeleton className="h-[400px] rounded-xl" />;
  }

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      (company.fantasy_name?.toLowerCase().includes(search.toLowerCase())) ||
      (company.industry_sector?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || company.subscription_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Empresas Clientes ({filteredCompanies.length})
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-[200px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" />
                    Funcs.
                  </div>
                </TableHead>
                <TableHead>Porte</TableHead>
                <TableHead>Tempo Médio</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {company.logo_url ? (
                          <img 
                            src={company.logo_url} 
                            alt={company.name} 
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {company.fantasy_name || company.name}
                          </p>
                          {company.fantasy_name && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {company.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{company.plan_name || '-'}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(company.subscription_status)}</TableCell>
                    <TableCell className="text-center font-medium">
                      {company.employee_count.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{getSizeBadge(company.employee_count)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {formatTenure(company.avg_tenure_months)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {company.industry_sector || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(company.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
