import { Check, X } from 'lucide-react';

const LINHAS: Array<[string, string | boolean, string | boolean]> = [
  ['Mapeia risco psicossocial (Anexo III NR-1)', true, true],
  ['Gera PGR e relatório técnico para fiscalização', true, true],
  ['Conecta com avaliação 9Box', false, true],
  ['Cruza risco com faixa salarial', false, true],
  ['Identifica top talent em burnout antes do pedido de demissão', false, true],
  ['Plano de ação priorizado por ROI (não só compliance)', false, true],
  ['Linguagem para o board (não só para o analista SST)', false, true],
  ['Entrega final', 'Laudo para arquivar', 'Decisão estratégica de pessoas'],
];

export default function Nr1TabelaCategoria() {
  return (
    <section className="container mx-auto px-4 py-14 bg-muted/30 rounded-3xl my-8 max-w-6xl">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          NR-1 Tradicional vs. <span className="nr1-text-primary">NR-1 Inteligente</span>
        </h2>
        <p className="text-muted-foreground">
          A diferença entre cumprir uma norma e usar o dado para reter quem importa.
        </p>
      </div>

      <div className="max-w-4xl mx-auto overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0 bg-card rounded-xl overflow-hidden shadow-sm">
          <thead>
            <tr>
              <th className="text-left p-4 border-b" />
              <th className="p-4 border-b text-center font-semibold text-muted-foreground">
                NR-1 Tradicional
                <p className="text-[10px] font-normal mt-0.5">(plataformas de compliance)</p>
              </th>
              <th className="p-4 border-b text-center font-bold nr1-bg-soft nr1-text-primary">
                NR-1 Inteligente
                <p className="text-[10px] font-normal mt-0.5">(CompSmart)</p>
              </th>
            </tr>
          </thead>
          <tbody>
            {LINHAS.map(([label, v1, v2], i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-3.5 font-medium border-b">{label}</td>
                <td className="p-3.5 text-center border-b">
                  {typeof v1 === 'boolean'
                    ? v1
                      ? <Check className="h-4 w-4 inline text-[hsl(var(--nr1-success))]" />
                      : <X className="h-4 w-4 inline text-muted-foreground/50" />
                    : <span className="text-xs text-muted-foreground italic">{v1}</span>}
                </td>
                <td className="p-3.5 text-center nr1-bg-soft border-b">
                  {typeof v2 === 'boolean'
                    ? v2
                      ? <Check className="h-4 w-4 inline text-[hsl(var(--nr1-success))]" />
                      : <X className="h-4 w-4 inline text-muted-foreground" />
                    : <span className="text-xs font-semibold nr1-text-primary">{v2}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
