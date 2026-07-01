import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';

type Summary = {
  avatars: { scanned: number; refreshed: number; failed: number };
  logos: { scanned: number; refreshed: number; failed: number };
};

export function StorageMigrationCard() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const run = async () => {
    setLoading(true);
    setSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke('refresh-storage-urls');
      if (error) throw error;
      if (!data?.ok) throw new Error('Falha na migração');
      setSummary(data.summary);
      toast.success('Migração concluída com sucesso');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Migração de URLs de Storage
        </CardTitle>
        <CardDescription>
          Converte URLs públicas antigas de avatares e logos em URLs assinadas de longa duração
          (validade de 10 anos). Execute apenas uma vez após o reforço de segurança nos buckets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={run} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Executar migração agora
            </>
          )}
        </Button>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="font-semibold mb-1">Avatares</p>
              <p>Analisados: {summary.avatars.scanned}</p>
              <p className="text-emerald-600">Atualizados: {summary.avatars.refreshed}</p>
              <p className="text-destructive">Falhas: {summary.avatars.failed}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="font-semibold mb-1">Logos de empresas</p>
              <p>Analisados: {summary.logos.scanned}</p>
              <p className="text-emerald-600">Atualizados: {summary.logos.refreshed}</p>
              <p className="text-destructive">Falhas: {summary.logos.failed}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
