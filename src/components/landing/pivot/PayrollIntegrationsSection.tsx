import { FileSpreadsheet, Info } from "lucide-react";

const SISTEMAS = ["TOTVS", "Senior", "ADP", "Domínio", "Excel / CSV"];

export const PayrollIntegrationsSection = () => (
  <section className="py-16 md:py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto text-center space-y-5">
        <h2 className="text-2xl md:text-4xl font-bold">
          Conecta com a sua folha
        </h2>
        <p className="text-muted-foreground">
          Importe a base de colaboradores dos principais sistemas do mercado ou
          de qualquer planilha própria.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {SISTEMAS.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
            >
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              {s}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">
              É importação de dados, não processamento de folha.
            </strong>{" "}
            A CompSmart não calcula holerite nem substitui o seu sistema de
            folha: ela lê a base de colaboradores para gerar inteligência de
            gestão de pessoas.
          </p>
        </div>
      </div>
    </div>
  </section>
);
