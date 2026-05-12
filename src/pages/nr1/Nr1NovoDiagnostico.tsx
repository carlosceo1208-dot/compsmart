import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useNr1Questoes } from '@/hooks/useNr1';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { RESPOSTA_OPCOES, respondentHash, DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';
import { Loader2 } from 'lucide-react';
import { Nr1ConsentReconfirm } from '@/components/nr1/Nr1ConsentGate';

export default function Nr1NovoDiagnostico() {
  const { activeCompanyId } = useCompanyContext();
  const { data: questoes, isLoading } = useNr1Questoes(false);
  const navigate = useNavigate();
  const [step, setStep] = useState<'config' | 'questionario' | 'enviando'>('config');
  const [cicloNome, setCicloNome] = useState(`Ciclo ${new Date().getFullYear()}`);
  const [diagnosticoId, setDiagnosticoId] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [consentOk, setConsentOk] = useState(false);

  const questao = questoes?.[currentIdx];
  const total = questoes?.length ?? 0;
  const progress = total > 0 ? ((currentIdx + 1) / total) * 100 : 0;

  const iniciar = async () => {
    if (!activeCompanyId) {
      toast({ title: 'Empresa não selecionada', variant: 'destructive' });
      return;
    }
    if (cicloNome.trim().length < 3) {
      toast({ title: 'Nome do ciclo muito curto', variant: 'destructive' });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('nr1_diagnosticos')
      .insert({
        company_id: activeCompanyId,
        ciclo_nome: cicloNome.trim(),
        status: 'em_andamento',
        created_by: user?.id,
      })
      .select()
      .single();
    if (error) {
      toast({ title: 'Erro ao iniciar', description: error.message, variant: 'destructive' });
      return;
    }
    setDiagnosticoId(data.id);
    setStep('questionario');
  };

  const responder = async (valor: number) => {
    if (!questao || !diagnosticoId) return;
    setRespostas((r) => ({ ...r, [questao.id]: valor }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const hash = await respondentHash(user.id, diagnosticoId);

    await supabase.from('nr1_diagnostico_respostas').upsert(
      { diagnostico_id: diagnosticoId, respondent_hash: hash, questao_id: questao.id, resposta: valor },
      { onConflict: 'diagnostico_id,respondent_hash,questao_id' }
    );

    if (currentIdx + 1 < total) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finalizar();
    }
  };

  const finalizar = async () => {
    if (!diagnosticoId) return;
    setStep('enviando');
    // Recalcula scores
    await supabase.rpc('nr1_recompute_scores', { p_diagnostico_id: diagnosticoId });
    await supabase
      .from('nr1_diagnosticos')
      .update({ status: 'concluido', periodo_fim: new Date().toISOString().slice(0, 10) })
      .eq('id', diagnosticoId);
    toast({ title: 'Diagnóstico concluído!', description: 'Veja o relatório completo.' });
    navigate(`/nr1/diagnostico/${diagnosticoId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin nr1-text-primary" />
      </div>
    );
  }

  if (step === 'config') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Iniciar Novo Diagnóstico NR-1</CardTitle>
          <CardDescription>
            Aplicação anônima de {total} perguntas baseadas em metodologia COPSOQ-III, agrupadas em 6 dimensões psicossociais.
            Suas respostas individuais não são identificadas — apenas dados agregados aparecem no relatório.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ciclo">Nome do ciclo</Label>
            <Input
              id="ciclo"
              value={cicloNome}
              onChange={(e) => setCicloNome(e.target.value)}
              maxLength={120}
              placeholder="Ex: Ciclo 2026 Q1"
            />
          </div>

          <Nr1ConsentReconfirm
            cycleLabel={cicloNome.trim() || 'Novo ciclo'}
            onConfirmed={() => setConsentOk(true)}
            confirmed={consentOk}
          />

          <Button
            onClick={iniciar}
            disabled={!consentOk}
            className="nr1-bg-primary w-full sm:w-auto"
          >
            Começar questionário
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'enviando') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-10 pb-10 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto nr1-text-primary" />
          <p className="text-sm text-muted-foreground">Calculando scores e gerando relatório…</p>
        </CardContent>
      </Card>
    );
  }

  // Questionario
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Pergunta {currentIdx + 1} de {total}</span>
          <span>{DIMENSAO_LABEL[questao!.dimensao as Dimensao]}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="text-lg mt-4 leading-snug">{questao!.enunciado}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          key={questao!.id}
          value={respostas[questao!.id]?.toString()}
          onValueChange={(v) => responder(Number(v))}
          className="space-y-2"
        >
          {RESPOSTA_OPCOES.map((opt) => (
            <Label
              key={opt.value}
              htmlFor={`opt-${opt.value}`}
              className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-accent transition-colors"
            >
              <RadioGroupItem value={opt.value.toString()} id={`opt-${opt.value}`} />
              <span className="text-sm">{opt.label}</span>
            </Label>
          ))}
        </RadioGroup>
        {currentIdx > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => setCurrentIdx(currentIdx - 1)}
          >
            ← Anterior
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
