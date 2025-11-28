import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  ArrowUpRight, 
  Crown,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';

interface Subscription {
  id: string;
  plan_id: string;
  billing_cycle: string;
  status: string;
  monthly_price: number;
  annual_price: number;
  started_at: string;
  next_billing_date: string | null;
  last_payment_date: string | null;
  subscription_plans: {
    name: string;
    features: string[];
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  issue_date: string;
  paid_at: string | null;
  payment_method: string | null;
}

export default function Billing() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.root_company_id) return;

      // Fetch subscription
      const { data: subData } = await supabase
        .from('company_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('company_id', profile.root_company_id)
        .eq('status', 'active')
        .single();

      if (subData) {
        setSubscription(subData as any);
      }

      // Fetch invoices
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', profile.root_company_id)
        .order('issue_date', { ascending: false })
        .limit(10);

      if (invoiceData) {
        setInvoices(invoiceData);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Erro ao carregar dados de cobrança');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
      trial: { label: 'Trial', className: 'bg-blue-100 text-blue-700' },
      canceled: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
      past_due: { label: 'Em Atraso', className: 'bg-yellow-100 text-yellow-700' },
      paid: { label: 'Pago', className: 'bg-green-100 text-green-700' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cobrança e Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie seu plano, métodos de pagamento e histórico de faturas
          </p>
        </div>

        {/* Plano Atual */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle>Plano Atual</CardTitle>
              </div>
              {subscription && getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{subscription.subscription_plans?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cobrança {subscription.billing_cycle === 'annual' ? 'Anual' : 'Mensal'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      R$ {(subscription.billing_cycle === 'annual' 
                        ? subscription.annual_price 
                        : subscription.monthly_price
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.billing_cycle === 'annual' ? '/ano' : '/mês'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Próxima cobrança:</span>
                    <span className="font-medium">
                      {subscription.next_billing_date 
                        ? format(new Date(subscription.next_billing_date), 'dd/MM/yyyy', { locale: ptBR })
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Último pagamento:</span>
                    <span className="font-medium">
                      {subscription.last_payment_date 
                        ? format(new Date(subscription.last_payment_date), 'dd/MM/yyyy', { locale: ptBR })
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Alterar Plano
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma assinatura ativa</h3>
                <p className="text-muted-foreground mb-4">
                  Escolha um plano para começar a usar todos os recursos do CompSmart.
                </p>
                <Button onClick={() => window.location.href = '/pricing'}>
                  Ver Planos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Faturas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Faturas
            </CardTitle>
            <CardDescription>
              Suas últimas faturas e comprovantes de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        R$ {invoice.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="capitalize">
                        {invoice.payment_method === 'pix' ? 'PIX' : 
                         invoice.payment_method === 'credit_card' ? 'Cartão' : 
                         invoice.payment_method === 'boleto' ? 'Boleto' : 
                         invoice.payment_method || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma fatura encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
