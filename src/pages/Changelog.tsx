import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { changelogEntries, categoryStyles, categoryLabels } from "@/data/changelog";

const Changelog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const filteredEntries = useMemo(() => {
    return changelogEntries.filter(entry => {
      // Filter by search query
      const matchesSearch = searchQuery === "" || 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by category
      const matchesCategory = selectedCategory === "all" || entry.category === selectedCategory;
      
      // Filter by period
      let matchesPeriod = true;
      if (selectedPeriod !== "all") {
        const entryDate = new Date(entry.date);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (selectedPeriod === "30") matchesPeriod = daysDiff <= 30;
        else if (selectedPeriod === "90") matchesPeriod = daysDiff <= 90;
        else if (selectedPeriod === "180") matchesPeriod = daysDiff <= 180;
      }
      
      return matchesSearch && matchesCategory && matchesPeriod;
    });
  }, [searchQuery, selectedCategory, selectedPeriod]);

  const stats = useMemo(() => ({
    total: changelogEntries.length,
    lancamentos: changelogEntries.filter(e => e.category === 'lancamento').length,
    novos: changelogEntries.filter(e => e.category === 'novo').length,
    melhorias: changelogEntries.filter(e => e.category === 'melhoria').length,
    correcoes: changelogEntries.filter(e => e.category === 'correcao').length,
  }), []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Home
          </Button>

          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Changelog
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Histórico de{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Atualizações
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Acompanhe todas as novidades, melhorias e correções da plataforma CompSmart
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-card border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.lancamentos}</p>
              <p className="text-sm text-muted-foreground">Lançamentos</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.novos}</p>
              <p className="text-sm text-muted-foreground">Novidades</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.melhorias}</p>
              <p className="text-sm text-muted-foreground">Melhorias</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.correcoes}</p>
              <p className="text-sm text-muted-foreground">Correções</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atualizações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="lancamento">Lançamentos</SelectItem>
                <SelectItem value="novo">Novidades</SelectItem>
                <SelectItem value="melhoria">Melhorias</SelectItem>
                <SelectItem value="correcao">Correções</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full md:w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo histórico</SelectItem>
                <SelectItem value="30">Último mês</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeline */}
          <div className="max-w-4xl mx-auto">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma atualização encontrada com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-primary/20" />
                
                {/* Entries */}
                <div className="space-y-8">
                  {filteredEntries.map((entry, index) => {
                    const Icon = entry.icon;
                    return (
                      <div 
                        key={index}
                        className="relative pl-20 group"
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-5 top-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        
                        {/* Card */}
                        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all group-hover:border-primary/30">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-foreground">{entry.title}</h3>
                                <span className="text-sm text-muted-foreground">{formatDate(entry.date)}</span>
                              </div>
                            </div>
                            <Badge className={categoryStyles[entry.category]}>
                              {categoryLabels[entry.category]}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-4 pl-12">
                            {entry.description}
                          </p>
                          {entry.details && entry.details.length > 0 && (
                            <ul className="pl-12 space-y-1.5">
                              {entry.details.map((detail, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary mt-1.5">•</span>
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">
              Quer experimentar todas essas funcionalidades?
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg"
            >
              Iniciar Teste Grátis
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Changelog;
