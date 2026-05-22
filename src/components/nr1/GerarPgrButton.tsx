import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FileCheck2, Loader2, Download, Printer, Eye, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useNr1Diagnosticos, useNr1Subscription } from '@/hooks/useNr1';
import { useNr1PlanosAcao } from '@/hooks/useNr1PlanosAcao';
import { gerarPgrPdf, type PgrDiagnosticoInput, type PgrInput } from '@/lib/nr1Pgr';
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

  const buildInput = (): PgrInput | null => {
    if (!activeCompany) {
      toast.error('Selecione uma empresa ativa.');
      return null;
    }
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
      return null;
    }

    const planoFiltrado = diagnostico
      ? (planos ?? []).filter((p) => p.diagnostico_id != null)
      : (planos ?? []);

    return {
      empresa: {
        nome: activeCompany.name,
        fantasia: activeCompany.fantasy_name,
        grauRiscoInss: ((sub as any)?.grau_risco_inss as GrauRiscoInss | null) ?? null,
      },
      diagnosticos: diags,
      planoAcao: planoFiltrado,
      escopo: diagnostico ? 'ciclo' : 'consolidado',
    };
  };

  const run = async (action: 'download' | 'print' | 'preview') => {
    setLoading(true);
    try {
      const input = buildInput();
      if (!input) return;
      const doc = gerarPgrPdf(input);
      const filename = `PGR_${(activeCompany?.fantasy_name || activeCompany?.name || 'empresa').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

      if (action === 'download') {
        doc.save(filename);
        toast.success('PGR baixado com sucesso');
      } else if (action === 'print') {
        doc.autoPrint();
        const url = doc.output('bloburl');
        const w = window.open(url, '_blank');
        if (!w) toast.error('Bloqueador de pop-up impediu a impressão');
      } else {
        const url = doc.output('bloburl');
        const w = window.open(url, '_blank');
        if (!w) toast.error('Bloqueador de pop-up impediu a visualização');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar PGR', { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={loading} variant={variant} size={size} className={className}>
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileCheck2 className="h-4 w-4 mr-1" />}
          Gerar PGR
          <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => run('download')}>
          <Download className="h-4 w-4 mr-2" /> Baixar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run('preview')}>
          <Eye className="h-4 w-4 mr-2" /> Visualizar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => run('print')}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
