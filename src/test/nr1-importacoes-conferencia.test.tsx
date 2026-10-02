import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const mutateAsync = vi.fn();
vi.mock('@/hooks/useNr1Importacoes', async (orig) => ({
  ...(await orig<typeof import('@/hooks/useNr1Importacoes')>()),
  useConferirImportacao: () => ({ mutateAsync, isPending: false }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { Nr1ImportacaoDetalhe, motivoSchema } from '@/components/nr1/Nr1ImportacaoDetalhe';
import type { Nr1Importacao } from '@/hooks/useNr1Importacoes';

const base: Nr1Importacao = {
  id: '1', company_id: 'c', modo: 'texto', metodologia: 'HSE', metodologia_outra: null, arquivo_path: null,
  arquivo_nome: null, consultoria: null, data_diagnostico: null, observacoes: null, status: 'pendente',
  mapeamento_resultado: null, mapeamento_aplicado: null, texto_livre: 'a;b\n1;2', motivo_rejeicao: null,
  conferido_em: null, created_at: '2026-10-01T10:00:00Z',
};
const ver = (s: Partial<Nr1Importacao>) => render(<Nr1ImportacaoDetalhe item={{ ...base, ...s }} onClose={() => {}} />);

describe('Conferência de importações — travas na tela', () => {
  it('pendente mostra os dois botões', () => {
    ver({});
    expect(screen.getByText('Marcar como conferido')).toBeInTheDocument();
    expect(screen.getByText('Rejeitar')).toBeInTheDocument();
  });
  it('conferida não oferece ações', () => {
    ver({ status: 'conferido' });
    expect(screen.queryByText('Marcar como conferido')).toBeNull();
    expect(screen.queryByText('Rejeitar')).toBeNull();
  });
  it('rejeitada não oferece ações e mostra o motivo', () => {
    ver({ status: 'rejeitado', motivo_rejeicao: 'Colunas trocadas' });
    expect(screen.queryByText('Marcar como conferido')).toBeNull();
    expect(screen.getByText(/Colunas trocadas/)).toBeInTheDocument();
  });
  it('rejeitar sem motivo é bloqueado e não chama o servidor', () => {
    ver({});
    fireEvent.click(screen.getByText('Rejeitar'));
    fireEvent.click(screen.getByText('Confirmar rejeição'));
    expect(screen.getByText(/Informe o motivo/)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(motivoSchema.safeParse('  ').success).toBe(false);
  });
});
