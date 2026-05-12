import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Cruzamento ilustrativo: pesquisa x recortes sociodemográficos
const recortes = [
  { titulo: 'Por gênero', linhas: [
    { rotulo: 'Feminino',  fib: 68, segPsi: 62, hse: 71 },
    { rotulo: 'Masculino', fib: 72, segPsi: 65, hse: 74 },
    { rotulo: 'Não-binário', fib: 64, segPsi: 58, hse: 69 },
  ]},
  { titulo: 'Por faixa etária', linhas: [
    { rotulo: '< 25 anos',  fib: 70, segPsi: 60, hse: 72 },
    { rotulo: '25–34',      fib: 71, segPsi: 64, hse: 73 },
    { rotulo: '35–44',      fib: 69, segPsi: 67, hse: 74 },
    { rotulo: '45–54',      fib: 66, segPsi: 65, hse: 70 },
    { rotulo: '55+',        fib: 64, segPsi: 63, hse: 68 },
  ]},
  { titulo: 'Por tempo de casa', linhas: [
    { rotulo: '< 1 ano', fib: 73, segPsi: 66, hse: 75 },
    { rotulo: '1–3 anos', fib: 70, segPsi: 64, hse: 72 },
    { rotulo: '3–5 anos', fib: 68, segPsi: 63, hse: 70 },
    { rotulo: '5+ anos', fib: 65, segPsi: 61, hse: 68 },
  ]},
  { titulo: 'Por área', linhas: [
    { rotulo: 'Operações', fib: 62, segPsi: 55, hse: 64 },
    { rotulo: 'Comercial', fib: 70, segPsi: 64, hse: 71 },
    { rotulo: 'Tecnologia', fib: 74, segPsi: 70, hse: 76 },
    { rotulo: 'Administrativo', fib: 71, segPsi: 66, hse: 72 },
  ]},
];

function corCelula(v: number) {
  if (v >= 70) return 'bg-green-100 text-green-900';
  if (v >= 60) return 'bg-yellow-100 text-yellow-900';
  if (v >= 50) return 'bg-orange-100 text-orange-900';
  return 'bg-red-100 text-red-900';
}

export default function Nr1Sociodemografico() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Cruzamento Sociodemográfico</h2>
        <p className="text-sm text-muted-foreground">
          Resultados consolidados das pesquisas por recortes de perfil. Heatmap 0–100 (verde = saudável, vermelho = crítico).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {recortes.map((r) => (
          <Card key={r.titulo}>
            <CardHeader>
              <CardTitle className="text-base">{r.titulo}</CardTitle>
              <CardDescription>FIB · Segurança Psicológica · HSE</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-2">Segmento</th>
                      <th className="py-2 px-2 text-center">FIB</th>
                      <th className="py-2 px-2 text-center">Seg. Psi.</th>
                      <th className="py-2 px-2 text-center">HSE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.linhas.map((l) => (
                      <tr key={l.rotulo} className="border-t">
                        <td className="py-2 pr-2 font-medium">{l.rotulo}</td>
                        <td className={`py-2 px-2 text-center tabular-nums ${corCelula(l.fib)}`}>{l.fib}</td>
                        <td className={`py-2 px-2 text-center tabular-nums ${corCelula(l.segPsi)}`}>{l.segPsi}</td>
                        <td className={`py-2 px-2 text-center tabular-nums ${corCelula(l.hse)}`}>{l.hse}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
