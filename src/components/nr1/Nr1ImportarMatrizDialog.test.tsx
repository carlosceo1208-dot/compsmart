import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nr1ImportarMatrizDialog } from "./Nr1ImportarMatrizDialog";

vi.mock("@/contexts/CompanyContext", () => ({
  useCompanyContext: () => ({ activeCompanyId: "test-company-id" }),
}));

vi.mock("@/hooks/useNr1MapeamentoTemplates", () => ({
  useNr1MapeamentoTemplates: () => ({ data: [] }),
  useSalvarMapeamentoTemplate: () => ({ mutateAsync: vi.fn() }),
  marcarUsoTemplate: vi.fn(),
  CAMPOS_DESTINO: [],
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("xlsx", () => ({
  read: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
  utils: {
    sheet_to_json: vi.fn(() => []),
  },
}));

describe("Nr1ImportarMatrizDialog", () => {
  it("exibe o texto do card Outra metodologia com a citação de viabilidade", () => {
    render(<Nr1ImportarMatrizDialog open={true} onOpenChange={() => {}} />);

    const texto =
      'Será necessário mapear fatores manualmente para o COPSOQ-III ("Depende de análise de viabilidade").';

    expect(screen.getByText(texto)).toBeInTheDocument();
  });
});
