import type jsPDF from 'jspdf';
import fontUrl from '@/assets/fonts/DejaVuSans-Bold.ttf?url';

export const PDF_FONTE = 'DejaVu';
let cache: string | null = null;

/** Embute a DejaVu Sans no jsPDF para "≥", "−" e acentos saírem corretos. */
export async function aplicarFonteUnicode(doc: jsPDF): Promise<string> {
  if (!cache) {
    const buf = new Uint8Array(await (await fetch(fontUrl)).arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    cache = btoa(bin);
  }
  doc.addFileToVFS('DejaVuSans-Bold.ttf', cache);
  doc.addFont('DejaVuSans-Bold.ttf', PDF_FONTE, 'normal');
  doc.addFont('DejaVuSans-Bold.ttf', PDF_FONTE, 'bold');
  doc.setFont(PDF_FONTE, 'normal');
  return PDF_FONTE;
}
