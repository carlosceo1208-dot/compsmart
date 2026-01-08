import { Sparkles, ArrowRight, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { changelogEntries, categoryStyles, categoryLabels } from "@/data/changelog";
import { useChangelogVisibility } from "@/hooks/useChangelogVisibility";

// Show only first 4 entries on landing page
const updates = changelogEntries.slice(0, 4);

export const WhatsNewSection = () => {
  const navigate = useNavigate();
  const { isChangelogVisible } = useChangelogVisibility();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Novidades
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que há de{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              novo
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Acompanhe as últimas atualizações e melhorias da plataforma CompSmart
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-primary/20" />
            
            {/* Updates */}
            <div className="space-y-8">
              {updates.map((update, index) => {
                const Icon = update.icon;
                return (
                  <div 
                    key={index}
                    className="relative pl-20 group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-5 top-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    
                    {/* Card */}
                    <div className="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-all group-hover:border-primary/30">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{update.title}</h3>
                            <span className="text-xs text-muted-foreground">{formatDate(update.date)}</span>
                          </div>
                        </div>
                        <Badge className={categoryStyles[update.category]}>
                          {categoryLabels[update.category]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground pl-11">
                        {update.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/auth')}
            className="group"
          >
            Comece agora e aproveite todas as novidades
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          {isChangelogVisible && (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/changelog')}
              className="group text-muted-foreground hover:text-primary"
            >
              <History className="mr-2 h-4 w-4" />
              Ver histórico completo
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};