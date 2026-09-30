import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileCheck2, Loader2, Download, Printer, Eye, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useNr1Diagnosticos, useNr1Subscription } from '@/hooks/useNr1';
import { useNr1PlanosAcao } from '@/hooks/useNr1PlanosAcao';
import { gerarPgrPdf, type PgrDiagnosticoInput, type PgrInput } from '@/lib/nr1Pgr';
import type { GrauRiscoInss } from '@/lib/nr1Risco';

interface Props {
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState('PGR.pdf');

  const buildInput = (): PgrInput | null => {
    if (!activeCompany) {
      toast.error('Selecione uma empresa ativa.');
      return null;
    }
    const diags: PgrDiagnosticoInput[] = diagnostico
      ? [diagnostico]
      : (diagnosticos ?? [])
          .filter((d) => d.status === 'concluido' && d.total_respondentes >= 5)
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

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const run = async (action: 'download' | 'print' | 'preview') => {
    setLoading(true);
    try {
      const input = buildInput();
      if (!input) return;
      const doc = gerarPgrPdf(input);
      const name = `PGR_${(activeCompany?.fantasy_name || activeCompany?.name || 'empresa').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      setFilename(name);

      if (action === 'download') {
        doc.save(name);
        toast.success('PGR baixado com sucesso');
        return;
      }

      // Preview e Print usam blob URL dentro de iframe (evita ERR_BLOCKED_BY_CLIENT)
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);

      if (action === 'print') {
        // Aguarda iframe montar e dispara print
        setTimeout(() => {
          const iframe = document.getElementById('pgr-preview-iframe') as HTMLIFrameElement | null;
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch {
            toast.message('Use o botão de impressão dentro do visualizador.');
          }
        }, 600);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar PGR', { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  const downloadFromPreview = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const printFromPreview = () => {
    const iframe = document.getElementById('pgr-preview-iframe') as HTMLIFrameElement | null;
    try {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch {
      toast.error('Não foi possível imprimir; baixe o PDF e imprima localmente.');
    }
  };

  return (
    <>
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

      <Dialog open={!!previewUrl} onOpenChange={(o) => { if (!o) closePreview(); }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-base">Visualização do PGR</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-muted overflow-hidden">
            {previewUrl && (
              <iframe
                id="pgr-preview-iframe"
                src={previewUrl}
                title="PGR Preview"
                className="w-full h-full border-0"
              />
            )}
          </div>
          <DialogFooter className="px-4 py-3 border-t flex flex-row sm:justify-end gap-2">
            <Button variant="outline" size="sm" onClick={closePreview}>
              <X className="h-4 w-4 mr-1" /> Fechar
            </Button>
            <Button variant="outline" size="sm" onClick={printFromPreview}>
              <Printer className="h-4 w-4 mr-1" /> Imprimir
            </Button>
            <Button size="sm" onClick={downloadFromPreview}>
              <Download className="h-4 w-4 mr-1" /> Baixar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
