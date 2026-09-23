import { Building2, ShieldAlert, FileCheck2, BellRing, Users2, Download, Sparkles } from 'lucide-react';

const RECURSOS = [
  {
    icon: Building2,
    titulo: 'Cadastro completo do prestador',
    sub: 'Razão social, CNPJ, área de atuação, nº de colaboradores e contatos — tudo centralizado por contratante.',
  },
  {
    icon: ShieldAlert,
    titulo: 'Grau de risco NR-4 automático',
    sub: 'Ao selecionar o grau (1 a 4), a plataforma exibe imediatamente as exigências de SST aplicáveis ao prestador.',
  },
  {
    icon: Users2,
    titulo: 'Contato de emergência obrigatório',
    sub: 'Nome, telefone e e-mail do responsável por acionamento em incidentes — exigência de auditorias e seguradoras.',
  },
  {
    icon: FileCheck2,
    titulo: 'Repositório de PGR versionado',
    sub: 'Upload, histórico e download do PGR de cada terceiro com versão, data de emissão e vencimento.',
  },
  {
    icon: BellRing,
    titulo: 'Alertas de vencimento',
    sub: 'Status visual: OK, vencendo (≤30 dias), vencido ou sem PGR — antes que vire passivo trabalhista.',
  },
  {
    icon: Download,
    titulo: 'Data de início do contrato',
    sub: 'Vinculamos o contrato de prestação de serviços ao ciclo de SST do contratante para rastreabilidade.',
  },
];

export default function Nr1GestaoTerceiros() {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full nr1-bg-soft border border-[hsl(var(--nr1-primary)/0.3)] text-xs font-semibold nr1-text-primary mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Novo · Diferencial CompSmart NR-1
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Gestão de <span className="nr1-text-primary">Terceiros & PGR</span> em um único lugar
        </h2>
        <p className="text-muted-foreground">
          A NR-1 responsabiliza o contratante pela cadeia de prestadores. Cadastre cada empresa
          terceira, registre o grau de risco, anexe o PGR e mantenha o contato de emergência
          sempre acessível — sem planilhas, sem retrabalho.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {RECURSOS.map((r) => (
          <div
            key={r.titulo}
            className="bg-card border rounded-xl p-5 h-full hover:shadow-md transition-shadow space-y-3"
          >
            <div className="w-10 h-10 rounded-lg nr1-bg-primary flex items-center justify-center">
              <r.icon className="h-5 w-5 text-white" />
            </div>
            <p className="font-semibold leading-snug">{r.titulo}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{r.sub}</p>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto mt-8 rounded-xl border-2 border-[hsl(var(--nr1-primary)/0.3)] nr1-bg-soft p-5 md:p-6">
        <p className="text-sm md:text-base text-center">
          <strong className="nr1-text-primary">Por que importa:</strong> em auditorias do MTE e em
          ações trabalhistas, a falta de PGR atualizado de um terceiro pode ser imputada ao
          contratante. A Gestão de Terceiros do CompSmart elimina esse risco com evidência
          documental versionada dentro do módulo NR-1.
        </p>
      </div>
    </section>
  );
}
