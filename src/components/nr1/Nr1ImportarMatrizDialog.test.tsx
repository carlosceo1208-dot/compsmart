import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nr1ImportarMatrizDialog, MetodologiaCard, METODOLOGIAS } from "./Nr1ImportarMatrizDialog";

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

vi.mock("@/components/ui/radio-group", () => ({
  RadioGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="radio-group">{children}</div>,
  RadioGroupItem: ({ value, id }: { value: string; id?: string }) => (
    <input type="radio" value={value} id={id} data-testid={`radio-${value}`} />
  ),
}));

describe("Nr1ImportarMatrizDialog", () => {
  it("exibe o texto do card Outra metodologia com a citação de viabilidade", () => {
    render(<Nr1ImportarMatrizDialog open={true} onOpenChange={() => {}} />);

    const texto =
      'Será necessário mapear fatores manualmente para o COPSOQ-III ("Depende de análise de viabilidade").';

    expect(screen.getByText(texto)).toBeInTheDocument();
  });
});

describe("MetodologiaCard — Outra metodologia", () => {
  const outra = METODOLOGIAS.find((m) => m.id === "OUTRA")!;

  it("exibe a descrição completa com a citação entre aspas", () => {
    render(
      <MetodologiaCard
        m={outra}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(
      screen.getByText(
        'Será necessário mapear fatores manualmente para o COPSOQ-III ("Depende de análise de viabilidade").'
      )
    ).toBeInTheDocument();
  });

  it("snapshot do card Outra metodologia permanece inalterado", () => {
    const { container } = render(
      <MetodologiaCard
        m={outra}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(container.firstElementChild).toMatchSnapshot();
  });

  it("exibe mensagem alternativa quando a descrição está vazia", () => {
    render(
      <MetodologiaCard
        m={{ ...outra, descricao: "" }}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(
      screen.getByText("Descrição indisponível. Entre em contato com o suporte para mais informações.")
    ).toBeInTheDocument();
  });
});
