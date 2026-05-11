import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const ESSENCIAL = [
  'Diagnóstico psicossocial ilimitado',
  'Banco COPSOQ-III adaptado (40 questões)',
  'Relatório com score por dimensão',
  'Exportação PDF para fiscalização',
  'Dashboard de risco psicossocial',
  '1 admin · respondentes ilimitados',
];

const PRO = [
  'Tudo do Essencial',
  'Plano de ação Kanban + evidências',
  'Treinamentos + certificados (em breve)',
  'Alertas inteligentes em tempo real',
  '★ Cruzamento NR-1 × 9Box × Remuneração',
  'Suporte prioritário',
];

export default function Nr1Contratar() {
  const { plan } = useFeatureAccess();
  const proIncluso = plan === 'pro' || plan === 'enterprise';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Escolha seu plano NR-1</h2>
        <p className="text-muted-foreground">
          Conformidade legal, plano de ação e monitoramento — sem precisar de consultor.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Essencial */}
        <Card>
          <CardHeader>
            <CardTitle>NR-1 Essencial</CardTitle>
            <CardDescription>Para quem precisa começar pela conformidade.</CardDescription>
            <div className="mt-3">
              <span className="text-3xl font-bold">R$ 349</span>
              <span className="text-muted-foreground">/mês · até 100 colab.</span>
            </div>
            <p className="text-xs text-muted-foreground">
              R$ 649/mês até 500 · R$ 1.190/mês acima de 500 · 14 dias grátis
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              {ESSENCIAL.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 nr1-text-primary mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full nr1-bg-primary">Começar trial de 14 dias</Button>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-2 border-[hsl(var(--nr1-primary))] relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="nr1-bg-primary"><Sparkles className="h-3 w-3 mr-1" />Mais completo</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              NR-1 Pro
              {proIncluso && <Badge className="nr1-risk-baixo">Já incluso no seu plano!</Badge>}
            </CardTitle>
            <CardDescription>Compliance + ação + inteligência integrada ao seu RH.</CardDescription>
            <div className="mt-3">
              {proIncluso ? (
                <span className="text-2xl font-bold text-[hsl(var(--nr1-success))]">Grátis para você</span>
              ) : (
                <>
                  <span className="text-3xl font-bold">+R$ 299</span>
                  <span className="text-muted-foreground">/mês como add-on</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ou faça upgrade para CompSmart Pro/Enterprise e ganhe NR-1 Pro sem custo adicional.
                  </p>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              {PRO.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 nr1-text-primary mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {proIncluso ? (
              <Button className="w-full nr1-bg-primary" asChild>
                <Link to="/nr1">Acessar NR-1 Pro</Link>
              </Button>
            ) : (
              <Button className="w-full" variant="outline" asChild>
                <Link to="/pricing">Ver planos CompSmart</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="nr1-bg-soft border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            <strong>Por que CompSmart?</strong> Únicos no mercado a cruzar risco psicossocial NR-1 com 9Box,
            eNPS e remuneração — identificando talentos em zona de burnout antes do pedido de demissão.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
