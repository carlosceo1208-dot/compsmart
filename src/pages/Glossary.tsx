import { ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import compsmartLogo from "@/assets/compsmart-logo.png";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}

const glossaryTerms: GlossaryTerm[] = [
  {
    term: "Amplitude Salarial",
    definition: "Diferença percentual entre o valor mínimo e máximo de uma faixa salarial. Indica a margem de progressão dentro de um mesmo cargo ou grade.",
    category: "Estrutura Salarial"
  },
  {
    term: "Benchmark",
    definition: "Processo de comparação de práticas salariais e de benefícios com o mercado ou com empresas de referência para garantir competitividade.",
    category: "Mercado"
  },
  {
    term: "Benefícios",
    definition: "Conjunto de vantagens oferecidas pela empresa além do salário, como plano de saúde, vale-alimentação, previdência privada, entre outros.",
    category: "Benefícios"
  },
  {
    term: "Compa-ratio",
    definition: "Indicador que mostra a posição do salário de um colaborador em relação ao ponto médio da faixa salarial do seu cargo. Compa-ratio = Salário / Ponto Médio.",
    category: "Indicadores"
  },
  {
    term: "Curva Salarial",
    definition: "Representação gráfica da relação entre os pontos de avaliação de cargos e os salários praticados, permitindo visualizar a política salarial da empresa.",
    category: "Estrutura Salarial"
  },
  {
    term: "Faixa Salarial",
    definition: "Intervalo de valores salariais definido para cada cargo ou grade, composto por um mínimo, ponto médio e máximo.",
    category: "Estrutura Salarial"
  },
  {
    term: "Grade",
    definition: "Classificação hierárquica que agrupa cargos com níveis semelhantes de complexidade, responsabilidade e requisitos.",
    category: "Estrutura de Cargos"
  },
  {
    term: "Hay (Metodologia)",
    definition: "Sistema de avaliação de cargos desenvolvido pela Korn Ferry que analisa três fatores: Know-how, Solução de Problemas e Responsabilidade por Resultados.",
    category: "Metodologia"
  },
  {
    term: "Headcount",
    definition: "Número total de colaboradores de uma organização em determinado período. Métrica fundamental para planejamento orçamentário.",
    category: "Gestão de Pessoas"
  },
  {
    term: "ICP (Incentivo de Curto Prazo)",
    definition: "Programas de remuneração variável vinculados a metas de até 1 ano, como bônus, PLR e comissões.",
    category: "Incentivos"
  },
  {
    term: "ILP (Incentivo de Longo Prazo)",
    definition: "Programas de remuneração variável com horizonte superior a 1 ano, como stock options, RSU e phantom shares.",
    category: "Incentivos"
  },
  {
    term: "INPC",
    definition: "Índice Nacional de Preços ao Consumidor, utilizado como referência para reajustes salariais e correções de tabelas.",
    category: "Indicadores"
  },
  {
    term: "Job Family (Família de Cargos)",
    definition: "Agrupamento de cargos com natureza de trabalho similar, mesmo que em níveis hierárquicos diferentes.",
    category: "Estrutura de Cargos"
  },
  {
    term: "Job Matching",
    definition: "Processo de correspondência entre cargos internos da empresa e cargos de referência do mercado para fins de comparação salarial.",
    category: "Mercado"
  },
  {
    term: "Matching (Previdência)",
    definition: "Contribuição adicional da empresa que acompanha ou multiplica a contribuição do colaborador em planos de previdência.",
    category: "Benefícios"
  },
  {
    term: "Mediana de Mercado",
    definition: "Valor salarial que divide a amostra de mercado em duas metades iguais. Ponto de referência comum para políticas salariais.",
    category: "Mercado"
  },
  {
    term: "Paymix",
    definition: "Composição da remuneração total dividida entre fixo e variável, indicando o perfil de risco e incentivo do pacote.",
    category: "Estrutura Salarial"
  },
  {
    term: "Phantom Shares",
    definition: "Instrumento de ILP que concede ao colaborador o direito de receber em dinheiro o valor equivalente à valorização das ações, sem transferência de participação societária.",
    category: "Incentivos"
  },
  {
    term: "PLR (Participação nos Lucros e Resultados)",
    definition: "Forma de remuneração variável prevista em lei, vinculada ao alcance de metas previamente acordadas entre empresa e colaboradores.",
    category: "Incentivos"
  },
  {
    term: "Ponto Médio",
    definition: "Valor central de uma faixa salarial, geralmente alinhado à mediana de mercado ou à política de competitividade da empresa.",
    category: "Estrutura Salarial"
  },
  {
    term: "Quartil",
    definition: "Divisão da amostra de mercado em quatro partes iguais. Q1 (25%), Q2 (50% - mediana), Q3 (75%).",
    category: "Mercado"
  },
  {
    term: "RSU (Restricted Stock Units)",
    definition: "Ações restritas concedidas ao colaborador que se tornam disponíveis após período de carência (vesting).",
    category: "Incentivos"
  },
  {
    term: "Salário Base",
    definition: "Remuneração fixa mensal do colaborador, sem considerar variáveis, benefícios ou adicionais.",
    category: "Estrutura Salarial"
  },
  {
    term: "Stock Options",
    definition: "Direito de comprar ações da empresa a um preço pré-fixado (preço de exercício) após período de carência.",
    category: "Incentivos"
  },
  {
    term: "Total Compensation",
    definition: "Pacote completo de remuneração incluindo salário base, benefícios, incentivos de curto e longo prazo.",
    category: "Estrutura Salarial"
  },
  {
    term: "Vesting",
    definition: "Calendário que define quando o colaborador adquire o direito ao benefício de incentivo de longo prazo.",
    category: "Incentivos"
  },
  {
    term: "Cliff",
    definition: "Período de carência inicial em programas de ILP durante o qual o colaborador não adquire direito ao benefício.",
    category: "Incentivos"
  }
];

const categories = [...new Set(glossaryTerms.map(t => t.category))].sort();

const Glossary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTerms = glossaryTerms
    .filter(term => {
      const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           term.definition.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || term.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.term.localeCompare(b.term, 'pt-BR'));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={compsmartLogo} alt="CompSmart" className="h-10 w-auto" />
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Glossário de C&S</h1>
        <p className="text-muted-foreground mb-8">
          Termos e conceitos essenciais de Compensação e Salários para gestão estratégica de remuneração.
        </p>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar termo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Terms List */}
        <div className="space-y-4">
          {filteredTerms.map((item, index) => (
            <div 
              key={index} 
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.term}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.definition}</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
          
          {filteredTerms.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum termo encontrado para "{searchTerm}"
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          {filteredTerms.length} de {glossaryTerms.length} termos
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CompSmart. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Glossary;
