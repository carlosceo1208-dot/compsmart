import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BookOpen,
  Search,
  ChevronDown,
  ClipboardCheck,
  TrendingUp,
  Brain,
  LayoutGrid,
  Award,
  Users,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  performanceGlossaryTerms,
  performanceGlossaryCategories,
  type PerformanceGlossaryTerm,
} from "@/data/performanceGlossaryTerms";

const categoryIcons: Record<string, React.ReactNode> = {
  avaliacao: <ClipboardCheck className="h-4 w-4" />,
  desenvolvimento: <TrendingUp className="h-4 w-4" />,
  competencias: <Brain className="h-4 w-4" />,
  ferramentas: <LayoutGrid className="h-4 w-4" />,
  reconhecimento: <Award className="h-4 w-4" />,
  sucessao: <Users className="h-4 w-4" />,
  nr1: <AlertTriangle className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  avaliacao: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  desenvolvimento: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  competencias: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  ferramentas: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  reconhecimento: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  sucessao: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  nr1: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function GlossaryTermCard({ term }: { term: PerformanceGlossaryTerm }) {
  const [isOpen, setIsOpen] = useState(false);

  const categoryLabel = performanceGlossaryCategories.find(
    (c) => c.id === term.category
  )?.label;

  return (
    <Card className="border-indigo-200/50 dark:border-indigo-800/30 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              {categoryIcons[term.category]}
            </div>
            <h3 className="font-semibold text-lg text-indigo-900 dark:text-indigo-100">
              {term.term}
            </h3>
          </div>
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${categoryColors[term.category]}`}
          >
            {categoryLabel}
          </Badge>
        </div>

        <p className="text-muted-foreground leading-relaxed mb-4">
          {term.summary}
        </p>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {isOpen ? "Fechar" : "Saiba mais"}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-4">
            <Separator className="bg-indigo-100 dark:bg-indigo-800/30" />

            {/* Full Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {term.fullContent}
              </div>
            </div>

            {/* Examples */}
            {term.examples && term.examples.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Exemplos Práticos
                </h4>
                <ul className="space-y-2">
                  {term.examples.map((example, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground bg-green-50/50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200/50 dark:border-green-800/30"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {term.tips && term.tips.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  Dicas de Aplicação
                </h4>
                <ul className="space-y-1.5">
                  {term.tips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-yellow-600 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Myths */}
            {term.myths && term.myths.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Mitos Desmistificados
                </h4>
                <div className="space-y-3">
                  {term.myths.map((myth, idx) => (
                    <div
                      key={idx}
                      className="bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-200/50 dark:border-orange-800/30"
                    >
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">
                        ❌ Mito: "{myth.myth}"
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ✅ Realidade: {myth.reality}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default function PerformanceGlossary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTerms = performanceGlossaryTerms
    .filter((term) => {
      const matchesSearch =
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.fullContent.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || term.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.term.localeCompare(b.term, "pt-BR"));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
          Glossário de Desempenho
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Termos e conceitos essenciais para gestão de desempenho, com exemplos
          práticos e dicas de aplicação.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar termo, conceito ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-indigo-200 dark:border-indigo-800/50 focus-visible:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={
              selectedCategory === null
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "border-indigo-200 dark:border-indigo-800/50"
            }
          >
            Todos ({performanceGlossaryTerms.length})
          </Button>
          {performanceGlossaryCategories.map((category) => {
            const count = performanceGlossaryTerms.filter(
              (t) => t.category === category.id
            ).length;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "border-indigo-200 dark:border-indigo-800/50"
                }
              >
                <span className="mr-1.5">{categoryIcons[category.id]}</span>
                {category.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTerms.map((term) => (
          <GlossaryTermCard key={term.term} term={term} />
        ))}
      </div>

      {/* Empty State */}
      {filteredTerms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum termo encontrado para "{searchTerm}"</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory(null);
            }}
            className="text-indigo-600 dark:text-indigo-400 mt-2"
          >
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t border-indigo-100 dark:border-indigo-800/30">
        {filteredTerms.length} de {performanceGlossaryTerms.length} termos •{" "}
        {performanceGlossaryCategories.length} categorias
      </div>
    </div>
  );
}
