import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lightbulb, Bug, Heart, HelpCircle, MessageSquare, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { useAllFeedbacks, useFeedbackKPIs, useUpdateFeedbackStatus, FeedbackType, FeedbackStatus } from '@/hooks/useFeedback';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const typeConfig: Record<FeedbackType, { label: string; icon: React.ReactNode; color: string }> = {
  suggestion: { label: 'Sugestão', icon: <Lightbulb className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  bug: { label: 'Bug', icon: <Bug className="h-4 w-4" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  praise: { label: 'Elogio', icon: <Heart className="h-4 w-4" />, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  question: { label: 'Dúvida', icon: <HelpCircle className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

const statusConfig: Record<FeedbackStatus, { label: string; color: string }> = {
  new: { label: 'Novo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  reviewing: { label: 'Em Análise', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  planned: { label: 'Planejado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  implemented: { label: 'Implementado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  declined: { label: 'Recusado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
};

export function FeedbackDashboard() {
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');

  const { data: feedbacks, isLoading: feedbacksLoading } = useAllFeedbacks({
    type: filterType === 'all' ? undefined : filterType,
    status: filterStatus === 'all' ? undefined : filterStatus,
  });
  const { data: kpis, isLoading: kpisLoading } = useFeedbackKPIs();
  const updateStatus = useUpdateFeedbackStatus();

  const handleStatusChange = (feedbackId: string, newStatus: FeedbackStatus) => {
    updateStatus.mutate({ id: feedbackId, status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Feedbacks dos Clientes</h2>
          <p className="text-sm text-muted-foreground">Gerencie sugestões e feedbacks dos usuários</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpisLoading ? <Skeleton className="h-7 w-12" /> : kpis?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpisLoading ? <Skeleton className="h-7 w-12" /> : kpis?.byType.suggestion || 0}</p>
                <p className="text-xs text-muted-foreground">Sugestões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <Bug className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpisLoading ? <Skeleton className="h-7 w-12" /> : kpis?.byType.bug || 0}</p>
                <p className="text-xs text-muted-foreground">Bugs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpisLoading ? <Skeleton className="h-7 w-12" /> : kpis?.avgNPS?.toFixed(1) || '-'}</p>
                <p className="text-xs text-muted-foreground">NPS Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpisLoading ? <Skeleton className="h-7 w-12" /> : kpis?.pending || 0}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Todos os Feedbacks</CardTitle>
          <CardDescription>Filtre e gerencie os feedbacks recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FeedbackType | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="suggestion">Sugestão</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="praise">Elogio</SelectItem>
                <SelectItem value="question">Dúvida</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FeedbackStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="reviewing">Em Análise</SelectItem>
                <SelectItem value="planned">Planejado</SelectItem>
                <SelectItem value="implemented">Implementado</SelectItem>
                <SelectItem value="declined">Recusado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {feedbacksLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden md:table-cell">Usuário</TableHead>
                    <TableHead className="hidden lg:table-cell">Empresa</TableHead>
                    <TableHead className="hidden sm:table-cell">NPS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbacks?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum feedback encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    feedbacks?.map((feedback: any) => (
                      <TableRow key={feedback.id}>
                        <TableCell>
                          <Badge className={`${typeConfig[feedback.type as FeedbackType]?.color} flex items-center gap-1 w-fit`}>
                            {typeConfig[feedback.type as FeedbackType]?.icon}
                            <span className="hidden sm:inline">{typeConfig[feedback.type as FeedbackType]?.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{feedback.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{feedback.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">
                            <p className="font-medium">{feedback.profiles?.full_name || 'Anônimo'}</p>
                            <p className="text-xs text-muted-foreground">{feedback.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm">{feedback.company?.name || '-'}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {feedback.nps_score !== null ? (
                            <Badge variant={feedback.nps_score >= 9 ? 'default' : feedback.nps_score >= 7 ? 'secondary' : 'destructive'}>
                              {feedback.nps_score}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={feedback.status}
                            onValueChange={(v) => handleStatusChange(feedback.id, v as FeedbackStatus)}
                          >
                            <SelectTrigger className="w-[130px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(feedback.created_at), { locale: ptBR, addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
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
