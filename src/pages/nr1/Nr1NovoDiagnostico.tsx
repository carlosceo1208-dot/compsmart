import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { toast } from '@/hooks/use-toast';
import { Check, Copy, Link2, Loader2, ShieldCheck } from 'lucide-react';

const defaultExpiry = () => {
  const date = new Date();
  date.setDate(date.getDate() + 21);
  return date.toISOString().slice(0, 10);
};

export default function Nr1NovoDiagnostico() {
  const { activeCompanyId } = useCompanyContext();
  const [cicloNome, setCicloNome] = useState(`Ciclo ${new Date().getFullYear()}`);
  const [grupo, setGrupo] = useState('Geral');
  const [expiresAt, setExpiresAt] = useState(defaultExpiry);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const criar = async () => {
    if (!activeCompanyId || cicloNome.trim().length < 3 || grupo.trim().length < 2 || !expiresAt) {
      toast({ title: 'Preencha o nome do ciclo, o grupo e o prazo.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: diagnostico, error: diagError } = await supabase
        .from('nr1_diagnosticos')
        .insert({ company_id: activeCompanyId, ciclo_nome: cicloNome.trim(), status: 'em_andamento', created_by: user?.id })
        .select('id')
        .single();
      if (diagError) throw diagError;

      const expiry = new Date(`${expiresAt}T23:59:59.999`);
      const { data: convite, error: inviteError } = await supabase
        .from('nr1_convites')
        .insert({ diagnostico_id: diagnostico.id, grupo: grupo.trim(), expires_at: expiry.toISOString() })
        .select('token')
        .single();
      if (inviteError) throw inviteError;

      setLink(`${window.location.origin}/nr1/responder/${convite.token}`);
      toast({ title: 'Ciclo e link anônimo criados.' });
    } catch (error) {
      toast({ title: 'Não foi possível criar o ciclo.', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copiar = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Novo diagnóstico</CardTitle>
        <CardDescription>Crie o ciclo e gere um link anônimo por grupo. Nenhuma resposta parcial será armazenada.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!link ? (
          <>
            <div className="space-y-2"><Label htmlFor="ciclo">Nome do ciclo</Label><Input id="ciclo" value={cicloNome} onChange={(e) => setCicloNome(e.target.value)} maxLength={120} placeholder="Ex.: Ciclo 2026 Q1" /></div>
            <div className="space-y-2"><Label htmlFor="grupo">Grupo de aplicação</Label><Input id="grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} maxLength={100} placeholder="Ex.: Operações" /></div>
            <div className="space-y-2"><Label htmlFor="prazo">Responder até</Label><Input id="prazo" type="date" min={new Date().toISOString().slice(0, 10)} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></div>
            <div className="flex gap-3 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"><ShieldCheck className="h-5 w-5 shrink-0 nr1-text-primary" /><p>O mesmo link pode ser compartilhado com todo o grupo. Os resultados só aparecem a partir de 5 participantes.</p></div>
            <Button onClick={criar} disabled={loading} className="nr1-bg-primary"><>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}Criar ciclo e gerar link</></Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-[hsl(var(--nr1-primary)/0.35)] bg-[hsl(var(--nr1-primary)/0.05)] p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold"><Check className="h-5 w-5 nr1-text-primary" />Link anônimo pronto</div>
              <p className="mb-3 text-sm text-muted-foreground">Compartilhe este link somente com o grupo “{grupo.trim()}”.</p>
              <div className="flex gap-2"><Input value={link} readOnly aria-label="Link anônimo do diagnóstico" /><Button variant="outline" onClick={copiar}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}<span className="sr-only">Copiar link</span></Button></div>
            </div>
            <Button variant="outline" onClick={() => { setLink(null); setGrupo('Geral'); }}>Criar outro ciclo</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}