import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, Mail, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';

type Invite = { full_name: string; email: string };
type Result = { email: string; ok: boolean; error?: string; user_id?: string };

export default function ConvidarSocios() {
  const role = useCurrentUserRole();
  const isSuperAdmin = role.data?.isSuperAdmin ?? false;

  const [invites, setInvites] = useState<Invite[]>([
    { full_name: 'Fernando', email: 'fcurral1@gmail.com' },
    { full_name: 'Josué Cruz', email: 'josue.cruz@gmail.com' },
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  if (role.isLoading) {
    return <div className="flex items-center gap-2 p-12 justify-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>;
  }
  if (!isSuperAdmin) {
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto mt-12">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso restrito</AlertTitle>
        <AlertDescription>Apenas Super Administradores podem convidar outros sócios.</AlertDescription>
      </Alert>
    );
  }

  const enviar = async () => {
    setLoading(true);
    setGlobalError(null);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('invite-super-admin', {
        body: { invites: invites.filter((i) => i.email && i.full_name) },
      });
      if (error) throw error;
      setResults((data as any)?.results ?? []);
    } catch (e: any) {
      setGlobalError(e?.message ?? 'Erro ao enviar convites');
    } finally {
      setLoading(false);
    }
  };

  const updateInv = (i: number, field: keyof Invite, v: string) => {
    setInvites((arr) => arr.map((x, idx) => (idx === i ? { ...x, [field]: v } : x)));
  };

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Convidar Sócios — Super Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Os convidados receberão um e-mail com link de ativação para definir a própria senha. Eles terão acesso total à plataforma (mesmo nível seu).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de convites</CardTitle>
          <CardDescription>Adicione nome completo e e-mail. Edite ou remova antes de enviar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invites.map((inv, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto] gap-2 items-end">
              <div>
                <Label className="text-xs">Nome completo</Label>
                <Input value={inv.full_name} onChange={(e) => updateInv(i, 'full_name', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">E-mail</Label>
                <Input type="email" value={inv.email} onChange={(e) => updateInv(i, 'email', e.target.value)} />
              </div>
              <Button
                variant="ghost" size="icon"
                onClick={() => setInvites((arr) => arr.filter((_, idx) => idx !== i))}
                disabled={invites.length === 1}
                aria-label="Remover"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={() => setInvites((arr) => [...arr, { full_name: '', email: '' }])}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar mais
          </Button>

          <div className="pt-2 flex justify-end">
            <Button onClick={enviar} disabled={loading || invites.length === 0}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Enviar convites
            </Button>
          </div>
        </CardContent>
      </Card>

      {globalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Falha ao enviar</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((r) => (
              <div key={r.email} className="flex items-start gap-2 text-sm">
                {r.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium">{r.email}</div>
                  <div className="text-muted-foreground text-xs">
                    {r.ok ? 'Convite enviado. Peça para conferir a caixa de entrada (ou spam).' : `Erro: ${r.error}`}
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2">
              💡 Caso o e-mail não chegue em até 5 minutos, peça para o sócio usar a opção <strong>"Esqueci minha senha"</strong> na tela de login com o mesmo e-mail.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
