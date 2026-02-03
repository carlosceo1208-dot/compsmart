import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Send,
  Eye,
  XCircle,
  Users,
  Mail,
  CheckCircle,
  Clock,
  RefreshCw,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalFeedbackStatusBadge } from "@/components/performance/ExternalFeedbackStatusBadge";
import { ExternalFeedbackRequestDialog } from "@/components/performance/ExternalFeedbackRequestDialog";
import { ExternalFeedbackResponseCard } from "@/components/performance/ExternalFeedbackResponseCard";
import {
  useExternalFeedbackRequests,
  useSendFeedbackRequest,
  useCancelFeedbackRequest,
  useExternalFeedbackKPIs,
  type ExternalFeedbackRequest,
} from "@/hooks/useExternalFeedbackRequests";
import { useExternalFeedbackResponses } from "@/hooks/useExternalFeedbackResponses";
import { usePerformanceCycles } from "@/hooks/usePerformanceCycles";
import type { Database } from "@/integrations/supabase/types";

type ExternalFeedbackStatus = Database["public"]["Enums"]["external_feedback_status"];

const externalTypeLabels: Record<string, string> = {
  customer: "Cliente",
  supplier: "Fornecedor",
  partner: "Parceiro",
  other: "Outro",
};

export default function ExternalFeedback360() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ExternalFeedbackStatus | "all">("all");
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ExternalFeedbackRequest | null>(null);

  const { cycles = [] } = usePerformanceCycles();
  const { data: kpis, isLoading: kpisLoading } = useExternalFeedbackKPIs();
  const { data: requests = [], isLoading } = useExternalFeedbackRequests({
    status: statusFilter === "all" ? undefined : statusFilter,
    cycleId: cycleFilter === "all" ? undefined : cycleFilter,
  });
  const { data: responses = [] } = useExternalFeedbackResponses(selectedRequest?.id);

  const sendRequest = useSendFeedbackRequest();
  const cancelRequest = useCancelFeedbackRequest();

  const handleSend = async (id: string) => {
    await sendRequest.mutateAsync(id);
  };

  const handleCancel = async (id: string) => {
    await cancelRequest.mutateAsync(id);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-600" />
            Feedback 360° Externo
          </h1>
          <p className="text-muted-foreground mt-1">
            Colete feedback de clientes, fornecedores e parceiros sobre seus colaboradores
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">
                <Mail className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpisLoading ? "..." : kpis?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-200 dark:bg-amber-800">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpisLoading ? "..." : kpis?.pending || 0}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-800">
                <Send className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpisLoading ? "..." : kpis?.sent || 0}</p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-200 dark:bg-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpisLoading ? "..." : kpis?.completed || 0}</p>
                <p className="text-xs text-muted-foreground">Respondidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-200 dark:bg-indigo-800">
                <RefreshCw className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpisLoading ? "..." : `${kpis?.responseRate || 0}%`}</p>
                <p className="text-xs text-muted-foreground">Taxa de Resposta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as ExternalFeedbackStatus | "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="completed">Respondido</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-64">
              <Select value={cycleFilter} onValueChange={setCycleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ciclo de Avaliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Ciclos</SelectItem>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Feedback</CardTitle>
          <CardDescription>
            Gerencie as solicitações de feedback 360° enviadas para avaliadores externos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação encontrada</p>
              <p className="text-sm mt-2">
                Clique em "Nova Solicitação" para começar
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Avaliador Externo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={request.employee?.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(request.employee?.full_name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.employee?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.employee?.job_title || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.external_name}</p>
                        <p className="text-xs text-muted-foreground">{request.external_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {externalTypeLabels[request.external_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.deadline), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <ExternalFeedbackStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {request.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSend(request.id)}
                            disabled={sendRequest.isPending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Enviar
                          </Button>
                        )}
                        {request.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Resposta
                          </Button>
                        )}
                        {(request.status === "pending" || request.status === "sent") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(request.id)}
                            disabled={cancelRequest.isPending}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <ExternalFeedbackRequestDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />

      {/* Response View Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resposta do Feedback 360°</DialogTitle>
            <DialogDescription>
              Feedback sobre {selectedRequest?.employee?.full_name} de{" "}
              {selectedRequest?.external_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {responses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma resposta encontrada
              </p>
            ) : (
              responses.map((response) => (
                <ExternalFeedbackResponseCard key={response.id} response={response} />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
