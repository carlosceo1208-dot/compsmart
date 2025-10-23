import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, CheckCircle2, Shield, Zap, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  const features = [
    {
      icon: Shield,
      title: "Segurança Enterprise",
      description: "Controle de acesso baseado em perfis com auditoria completa de todas as operações",
    },
    {
      icon: BarChart3,
      title: "Análises Avançadas",
      description: "Dashboards e relatórios estratégicos para tomada de decisão baseada em dados",
    },
    {
      icon: Zap,
      title: "Módulos Integrados",
      description: "Sistema completo e integrado para gestão de toda a estrutura de remuneração",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CompSmart</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestão de Remuneração</p>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate("/auth")}
            className="hidden sm:flex"
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <CheckCircle2 className="w-4 h-4" />
              Módulo 1 Disponível: Autenticação e Perfis
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Gestão Estratégica de
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Remuneração</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sistema modular completo para administração de salários, benefícios, 
            pesquisas de mercado e análises estratégicas de remuneração empresarial.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button 
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 shadow-lg"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-card/50 rounded-3xl mb-20">
        <h3 className="text-3xl font-bold text-center mb-16">
          Por que escolher o CompSmart?
        </h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-8 rounded-xl bg-background border border-border hover:border-primary/50 transition-all hover:shadow-lg"
            >
              <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-md">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules Overview */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h3 className="text-3xl font-bold">12 Módulos Integrados</h3>
          <p className="text-lg text-muted-foreground">
            Do cadastro de usuários à análise de equidade salarial, 
            o CompSmart oferece uma solução completa e escalável.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
            {[
              "Usuários", "Estrutura Org.", "Tabelas Salariais", "Pesquisa Salarial",
              "Plano de Cargos", "Simulador", "Análise de Equidade", "Benefícios",
              "Relatórios", "Exportação", "Configurações", "Auditoria"
            ].map((module, i) => (
              <div 
                key={i}
                className="p-4 rounded-lg bg-muted/50 text-sm font-medium hover:bg-muted transition-colors"
              >
                {module}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-primary-light/20 to-primary/5 border border-primary/20">
          <h3 className="text-3xl font-bold mb-4">
            Pronto para transformar sua gestão de remuneração?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Comece agora com o Módulo 1 de Autenticação e Perfis
          </p>
          <Button 
            size="lg"
            className="bg-gradient-primary hover:opacity-90 text-lg px-12 shadow-lg"
            onClick={() => navigate("/auth")}
          >
            Acessar Sistema
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 CompSmart. Sistema de Gestão de Remuneração Empresarial.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
