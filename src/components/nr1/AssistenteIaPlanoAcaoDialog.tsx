import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2, ListChecks } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUpsertPlanoAcao } from '@/hooks/useNr1PlanosAcao';
import { ACAO_PRIORIDADE_CLASS, ACAO_PRIORIDADE_LABEL } from '@/lib/nr1Risco';
import { DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';

interface Proposal {
  action: 'create' | 'update';
  id?: string;
  titulo: string;
  descricao?: string;
  dimensao?: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  status?: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
  prazo_dias?: number;
  responsavel_sugerido?: string;
  progresso?: number;
  justificativa: string;
}

const QUICK_PROMPTS = [
  'Sugira um plano completo de ações com base no diagnóstico mais recente.',
  'Priorize ações para a dimensão com maior risco psicossocial.',
  'Revise as ações em atraso e proponha novos prazos realistas.',
  'Gere ações alinhadas ao grau de risco INSS da empresa.',
  'Sugira ações de liderança e cultura para reduzir risco psicossocial.',
];

export function AssistenteIaPlanoAcaoDialog() {
  const [open, setOpen] = useState(false);
  const [instrucao, setInstrucao] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState('');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const upsert = useUpsertPlanoAcao();

  const reset = () => {
    setProposals([]);
    setResumo('');
    setSelected(new Set());
  };

  const submit = async (text?: string) => {
    const msg = (text ?? instrucao).trim();
    if (!msg) return;
    setLoading(true);
    reset();
    try {
      const { data, error } = await supabase.functions.invoke('nr1-plano-acao-assistant', {
        body: { instrucao: msg },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResumo(data?.resumo ?? '');
      const arr: Proposal[] = data?.actions ?? [];
      setProposals(arr);
      setSelected(new Set(arr.map((_, i) => i)));
    } catch (e: any) {
      toast({ title: 'Erro do assistente', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i: number) => {
    const ns = new Set(selected);
    ns.has(i) ? ns.delete(i) : ns.add(i);
    setSelected(ns);
  };

  const apply = async () => {
    const items = proposals.filter((_, i) => selected.has(i));
    if (items.length === 0) return;
    setLoading(true);
    try {
      for (const p of items) {
        const prazo = p.prazo_dias != null
          ? new Date(Date.now() + p.prazo_dias * 24 * 3600 * 1000).toISOString().slice(0, 10)
          : null;
        await upsert.mutateAsync({
          id: p.action === 'update' ? p.id : undefined,
          titulo: p.titulo,
          descricao: p.descricao ?? null,
          dimensao: p.dimensao ?? null,
          prioridade: p.prioridade,
          status: p.status ?? 'pendente',
          prazo,
          responsavel: p.responsavel_sugerido ?? null,
          progresso: p.progresso ?? 0,
        } as any);
      }
      toast({ title: `${items.length} ação(ões) aplicada(s)` });
      setOpen(false);
      reset();
      setInstrucao('');
    } catch (e: any) {
      toast({ title: 'Erro ao aplicar', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="nr1-bg-primary">
        <Sparkles className="h-4 w-4 mr-1" /> Gerar com IA
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 nr1-text-primary" />
              Assistente IA do Plano de Ação
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              O agente Bem-Estar lê seu diagnóstico, grau de risco INSS e ações atuais para sugerir, revisar ou
              atualizar ações. Você aprova antes de aplicar.
            </p>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  disabled={loading}
                  onClick={() => { setInstrucao(q); submit(q); }}
                  className="text-xs px-2 py-1 rounded-full border border-[hsl(var(--nr1-primary)/0.3)] hover:bg-[hsl(var(--nr1-primary)/0.08)] disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            <Textarea
              rows={3}
              placeholder="Ou descreva o que precisa: ex.: 'crie ações de capacitação de líderes para reduzir o risco em Relações e Liderança'"
              value={instrucao}
              onChange={(e) => setInstrucao(e.target.value)}
              disabled={loading}
            />

            <div className="flex justify-end">
              <Button onClick={() => submit()} disabled={loading || !instrucao.trim()} className="nr1-bg-primary">
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                Consultar IA
              </Button>
            </div>

            {resumo && (
              <div className="p-3 rounded-md nr1-bg-soft text-sm">
                <strong>Resumo: </strong>{resumo}
              </div>
            )}

            {proposals.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    {proposals.length} ação(ões) propostas — selecione e aplique
                  </h4>
                  <div className="flex gap-2 text-xs">
                    <button className="underline" onClick={() => setSelected(new Set(proposals.map((_, i) => i)))}>Todas</button>
                    <button className="underline" onClick={() => setSelected(new Set())}>Nenhuma</button>
                  </div>
                </div>
                {proposals.map((p, i) => (
                  <div key={i} className="border rounded-md p-3 flex gap-3">
                    <Checkbox checked={selected.has(i)} onCheckedChange={() => toggle(i)} className="mt-1" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="font-medium text-sm">{p.titulo}</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px]">{p.action === 'update' ? 'Atualizar' : 'Criar'}</Badge>
                          <Badge className={`text-[10px] ${ACAO_PRIORIDADE_CLASS[p.prioridade]}`}>
                            {ACAO_PRIORIDADE_LABEL[p.prioridade]}
                          </Badge>
                          {p.dimensao && (
                            <Badge variant="outline" className="text-[10px]">
                              {DIMENSAO_LABEL[p.dimensao as Dimensao] ?? p.dimensao}
                            </Badge>
                          )}
                          {p.prazo_dias != null && (
                            <Badge variant="outline" className="text-[10px]">{p.prazo_dias}d</Badge>
                          )}
                        </div>
                      </div>
                      {p.descricao && <p className="text-xs text-muted-foreground">{p.descricao}</p>}
                      {p.responsavel_sugerido && (
                        <p className="text-xs"><span className="text-muted-foreground">Responsável: </span>{p.responsavel_sugerido}</p>
                      )}
                      <p className="text-xs italic text-muted-foreground border-l-2 pl-2 border-[hsl(var(--nr1-primary))]">
                        {p.justificativa}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
            {proposals.length > 0 && (
              <Button onClick={apply} disabled={loading || selected.size === 0} className="nr1-bg-primary">
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ListChecks className="h-4 w-4 mr-1" />}
                Aplicar {selected.size} ação(ões)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
