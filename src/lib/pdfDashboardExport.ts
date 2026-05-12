import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Captura um elemento DOM (ex.: ref do painel) e gera um PDF executivo
 * preservando heatmaps, tabelas e gráficos como imagem de alta resolução.
 */
export async function exportDashboardToPDF(
  element: HTMLElement,
  opts: { filename: string; title: string; subtitle?: string },
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const headerH = 22;
  const contentW = pageW - margin * 2;

  // Header
  pdf.setFillColor(30, 39, 97); // Navy
  pdf.rect(0, 0, pageW, headerH, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(opts.title, margin, 10);
  if (opts.subtitle) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(opts.subtitle, margin, 16);
  }
  pdf.setFontSize(8);
  pdf.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageW - margin,
    10,
    { align: 'right' },
  );

  // Imagem do painel — paginada se ultrapassar a altura da página
  const imgData = canvas.toDataURL('image/png');
  const ratio = canvas.height / canvas.width;
  const imgW = contentW;
  const imgH = imgW * ratio;
  const availH = pageH - headerH - margin;

  if (imgH <= availH) {
    pdf.addImage(imgData, 'PNG', margin, headerH + 4, imgW, imgH);
  } else {
    // Paginação por fatias
    const pxPerMm = canvas.width / imgW;
    const sliceHmm = availH;
    const sliceHpx = sliceHmm * pxPerMm;
    let renderedPx = 0;
    let firstPage = true;

    while (renderedPx < canvas.height) {
      if (!firstPage) {
        pdf.addPage();
        pdf.setFillColor(30, 39, 97);
        pdf.rect(0, 0, pageW, headerH, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(opts.title, margin, 10);
      }
      const remainingPx = canvas.height - renderedPx;
      const thisSlicePx = Math.min(sliceHpx, remainingPx);

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = thisSlicePx;
      const ctx = slice.getContext('2d')!;
      ctx.drawImage(canvas, 0, renderedPx, canvas.width, thisSlicePx, 0, 0, canvas.width, thisSlicePx);

      pdf.addImage(
        slice.toDataURL('image/png'),
        'PNG',
        margin,
        headerH + 4,
        imgW,
        thisSlicePx / pxPerMm,
      );
      renderedPx += thisSlicePx;
      firstPage = false;
    }
  }

  pdf.save(opts.filename.endsWith('.pdf') ? opts.filename : `${opts.filename}.pdf`);
}
