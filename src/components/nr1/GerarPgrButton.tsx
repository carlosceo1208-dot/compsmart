import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileCheck2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useNr1Diagnosticos, useNr1Subscription } from '@/hooks/useNr1';
import { useNr1PlanosAcao } from '@/hooks/useNr1PlanosAcao';
import { baixarPgr, type PgrDiagnosticoInput } from '@/lib/nr1Pgr';
import type { GrauRiscoInss } from '@/lib/nr1Risco';

interface Props {
  /** Quando informado, gera PGR só desse diagnóstico; caso contrário consolida todos os concluídos. */
  diagnostico?: PgrDiagnosticoInput | null;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function GerarPgrButton({ diagnostico, variant = 'default', size = 'default', className }: Props) {
  const { activeCompany } = useCompanyContext();
  const { data: sub } = useNr1Subscription();
  const { data: diagnosticos } = useNr1Diagnosticos();
  const { data: planos } = useNr1PlanosAcao();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!activeCompany) {
      toast.error('Selecione uma empresa ativa.');
      return;
    }
    setLoading(true);
    try {
      const diags: PgrDiagnosticoInput[] = diagnostico
        ? [diagnostico]
        : (diagnosticos ?? [])
            .filter((d) => d.status === 'concluido')
            .map((d) => ({
              ciclo_nome: d.ciclo_nome,
              periodo_inicio: d.periodo_inicio,
              periodo_fim: d.periodo_fim,
              score_geral: d.score_geral as number | null,
              nivel_risco: d.nivel_risco as string | null,
              scores_dimensao: d.scores_dimensao as Record<string, number> | null,
              total_respondentes: d.total_respondentes,
            }));

      if (diags.length === 0) {
        toast.error('Nenhum diagnóstico concluído para incluir no PGR.');
        setLoading(false);
        return;
      }

      const planoFiltrado = diagnostico
        ? (planos ?? []).filter((p) => p.diagnostico_id != null)
        : (planos ?? []);

      baixarPgr({
        empresa: {
          nome: activeCompany.name,
          fantasia: activeCompany.fantasy_name,
          grauRiscoInss: ((sub as any)?.grau_risco_inss as GrauRiscoInss | null) ?? null,
        },
        diagnosticos: diags,
        planoAcao: planoFiltrado,
        escopo: diagnostico ? 'ciclo' : 'consolidado',
      });
      toast.success('PGR gerado com sucesso');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar PGR', { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handle} disabled={loading} variant={variant} size={size} className={className}>
      {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileCheck2 className="h-4 w-4 mr-1" />}
      Gerar PGR
    </Button>
  );
}
