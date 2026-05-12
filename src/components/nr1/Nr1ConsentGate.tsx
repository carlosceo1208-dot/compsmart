import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const NR1_CONSENT_VERSION = '2026.1';

const useConsentStatus = () =>
  useQuery({
    queryKey: ['nr1-consent-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { consented: true }; // unauthenticated: not our concern here
      // Super admins / admins not blocked — they're managing, not responding
      const { data: roles } = await supabase
        .from('user_roles').select('role').eq('user_id', user.id);
      const isAdmin = !!roles?.some(r => ['super_admin', 'admin', 'hr_admin'].includes(r.role as string));
      if (isAdmin) return { consented: true };
      const { data: prof } = await supabase
        .from('profiles').select('nr1_consent_at, nr1_consent_version').eq('id', user.id).maybeSingle();
      return {
        consented: !!prof?.nr1_consent_at && prof.nr1_consent_version === NR1_CONSENT_VERSION,
        userId: user.id,
      };
    },
    staleTime: 60_000,
  });

/**
 * Bloqueante: exibe modal de consentimento LGPD/COPSOQ-III no primeiro acesso
 * do colaborador ao módulo NR-1. Admins não são bloqueados.
 * Para reconfirmação por ciclo, embutir <Nr1ConsentReconfirm /> no início
 * do questionário de resposta (a ser criado).
 */
export const Nr1ConsentGate = () => {
  const { data, refetch } = useConsentStatus();
  const navigate = useNavigate();
  const [aceiteUso, setAceiteUso] = useState(false);
  const [aceiteAnonimato, setAceiteAnonimato] = useState(false);
  const [aceiteRevogacao, setAceiteRevogacao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const open = data ? !data.consented : false;
  const podeContinuar = aceiteUso && aceiteAnonimato && aceiteRevogacao;

  useEffect(() => {
    if (!open) {
      setAceiteUso(false); setAceiteAnonimato(false); setAceiteRevogacao(false);
    }
  }, [open]);

  const aceitar = async () => {
    if (!podeContinuar || !data?.userId) return;
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nr1_consent_at: new Date().toISOString(), nr1_consent_version: NR1_CONSENT_VERSION })
        .eq('id', data.userId);
      if (error) throw error;
      toast({ title: 'Consentimento registrado', description: 'Obrigado. Você já pode usar o módulo Saúde & Bem-Estar.' });
      await refetch();
    } catch (e: any) {
      toast({ title: 'Erro ao registrar consentimento', description: e.message, variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const recusar = () => {
    toast({
      title: 'Consentimento recusado',
      description: 'Sua recusa não tem qualquer impacto no seu vínculo ou avaliação.',
    });
    navigate('/dashboard');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) recusar(); }}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[hsl(var(--nr1-primary))] to-emerald-500 flex items-center justify-center text-white shadow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Consentimento — Saúde Mental & Bem-Estar</DialogTitle>
              <DialogDescription className="mt-1">
                Antes de acessar o módulo NR-1, precisamos do seu consentimento (LGPD).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            Suas respostas são <strong>anônimas e agregadas</strong>, utilizadas exclusivamente para
            cumprimento da NR-1 (riscos psicossociais) e melhoria das condições de trabalho.
            Nenhum gestor recebe respostas individuais.
          </p>

          {[
            { v: aceiteUso, set: setAceiteUso, label: 'Concordo com o uso das minhas respostas para o diagnóstico de riscos psicossociais (NR-1).' },
            { v: aceiteAnonimato, set: setAceiteAnonimato, label: 'Compreendo que minhas respostas serão tratadas de forma anônima e agregada.' },
            { v: aceiteRevogacao, set: setAceiteRevogacao, label: 'Sei que posso revogar este consentimento a qualquer momento em "Meu Perfil".' },
          ].map((it, i) => (
            <label key={i} className="flex items-start gap-2 p-3 rounded-md border cursor-pointer hover:bg-muted/40">
              <Checkbox checked={it.v} onCheckedChange={(c) => it.set(!!c)} className="mt-0.5" />
              <span className="text-sm leading-snug">{it.label}</span>
            </label>
          ))}

          <p className="text-xs text-muted-foreground">Versão do termo: {NR1_CONSENT_VERSION}</p>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button variant="ghost" onClick={recusar} disabled={salvando}>Não aceito</Button>
          <Button onClick={aceitar} disabled={!podeContinuar || salvando}>
            {salvando && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Aceitar e continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Reconfirmação leve embutida no início de cada novo questionário/ciclo.
 * Uso: <Nr1ConsentReconfirm onConfirmed={() => setStep(1)} />
 */
export const Nr1ConsentReconfirm = ({ onConfirmed, cycleLabel }: { onConfirmed: () => void; cycleLabel?: string }) => {
  const [ok, setOk] = useState(false);
  return (
    <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="h-4 w-4 text-[hsl(var(--nr1-primary))]" />
        Reconfirmação de consentimento {cycleLabel ? `· ${cycleLabel}` : ''}
      </div>
      <p className="text-xs text-muted-foreground">
        Confirmo que estou de acordo em participar deste ciclo. Minhas respostas continuam
        anônimas e agregadas, e posso interromper a qualquer momento.
      </p>
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={ok} onCheckedChange={(c) => setOk(!!c)} />
        <span className="text-sm">Confirmo e desejo iniciar o questionário</span>
      </label>
      <div className="flex justify-end">
        <Button size="sm" disabled={!ok} onClick={onConfirmed}>Iniciar</Button>
      </div>
    </div>
  );
};
