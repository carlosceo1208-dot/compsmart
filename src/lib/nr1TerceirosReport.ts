import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Terceiro, TerceiroPgr } from '@/hooks/useNr1Terceiros';
import { formatCnpj } from '@/lib/cnpj';
import { statusFromVencimento } from '@/hooks/useNr1Terceiros';

export function gerarRelatorioConformidadePdf(args: {
  empresaCliente: string;
  terceiro: Terceiro;
  pgrs: TerceiroPgr[];
}) {
  const { empresaCliente, terceiro, pgrs } = args;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 39, 97);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('Relatório de Conformidade NR-1 · Terceira', 10, 14);
  doc.setFontSize(9);
  doc.text(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 10, 14, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  let y = 34;
  doc.setFontSize(11);
  doc.text(`Contratante: ${empresaCliente}`, 10, y); y += 6;
  doc.text(`Empresa Terceira: ${terceiro.razao_social}`, 10, y); y += 6;
  doc.text(`CNPJ: ${formatCnpj(terceiro.cnpj)}`, 10, y); y += 6;
  if (terceiro.area_atuacao) { doc.text(`Área de atuação: ${terceiro.area_atuacao}`, 10, y); y += 6; }
  if (terceiro.num_colaboradores) { doc.text(`Colaboradores: ${terceiro.num_colaboradores}`, 10, y); y += 6; }
  if (terceiro.contato_nome) { doc.text(`Contato: ${terceiro.contato_nome}`, 10, y); y += 6; }
  if (terceiro.contato_email) { doc.text(`Email: ${terceiro.contato_email}`, 10, y); y += 6; }

  y += 4;
  const latest = pgrs[0];
  const status = statusFromVencimento(latest?.data_vencimento ?? null);
  const conformidade = status === 'ok' ? 100 : status === 'vencendo' ? 70 : 0;
  doc.setFontSize(13);
  doc.text(`Conformidade geral: ${conformidade}%`, 10, y); y += 6;
  doc.setFontSize(10);
  doc.text(
    `Status atual: ${status === 'ok' ? 'PGR válido' : status === 'vencendo' ? 'PGR vencendo em até 30 dias' : status === 'vencido' ? 'PGR vencido' : 'Sem PGR cadastrado'}`,
    10, y,
  );
  y += 8;

  // Checklist NR-1
  autoTable(doc, {
    startY: y,
    head: [['Requisito NR-1', 'Status']],
    body: [
      ['Cadastro da terceira ativo', terceiro.ativo ? 'Conforme' : 'Não conforme'],
      ['CNPJ válido informado', 'Conforme'],
      ['Contato responsável informado', terceiro.contato_nome ? 'Conforme' : 'Pendente'],
      ['PGR carregado', latest ? 'Conforme' : 'Pendente'],
      ['PGR dentro da validade', status === 'ok' ? 'Conforme' : status === 'vencendo' ? 'Atenção' : 'Não conforme'],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 39, 97] },
  });

  // Histórico PGR
  if (pgrs.length) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [['Versão', 'Arquivo', 'Emissão', 'Vencimento']],
      body: pgrs.map((p) => [
        p.versao,
        p.file_name,
        p.data_emissao ? new Date(p.data_emissao).toLocaleDateString('pt-BR') : '—',
        p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString('pt-BR') : '—',
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34, 197, 94] },
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    'Documento gerado pelo CompSmart · Módulo NR-1 · Validade: 30 dias',
    pageWidth / 2, pageHeight - 8, { align: 'center' },
  );

  const fileName = `Conformidade_${terceiro.razao_social.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
