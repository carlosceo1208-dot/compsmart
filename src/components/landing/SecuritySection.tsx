import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Building2, Database, ShieldCheck } from "lucide-react";

export const SecuritySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const securityFeatures = [
    {
      icon: ShieldCheck,
      title: "LGPD Compliance",
      description: "Totalmente em conformidade com a Lei Geral de Proteção de Dados",
      color: "text-green-600",
      bg: "bg-green-500/10",
      iconBg: "bg-green-500/20"
    },
    {
      icon: Lock,
      title: "Criptografia Ponta-a-Ponta",
      description: "Seus dados protegidos em trânsito e em repouso com AES-256",
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      iconBg: "bg-blue-500/20"
    },
    {
      icon: Building2,
      title: "Padrões ISO 27001",
      description: "Segurança da informação com padrões internacionais reconhecidos",
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      iconBg: "bg-purple-500/20"
    },
    {
      icon: Database,
      title: "Isolamento de Dados",
      description: "Cada empresa com ambiente totalmente segregado e independente",
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      iconBg: "bg-amber-500/20"
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-4 py-1.5 mb-6 text-sm">
              <Shield className="h-4 w-4 mr-2" />
              Segurança Enterprise
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Segurança de{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Nível Enterprise
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Seus dados sensíveis de folha de pagamento e remuneração estão protegidos com segurança de nível bancário
            </p>
          </div>

          {/* Security Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((feature, index) => (
              <Card 
                key={index}
                className={`relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${feature.bg}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.5s ease-out ${index * 0.1}s`,
                  borderColor: 'transparent'
                }}
              >
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full" />
                
                <CardHeader className="relative pb-2">
                  <div className={`p-3 rounded-xl w-fit ${feature.iconBg}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <CardTitle className={`text-lg mb-2 ${feature.color}`}>
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer Text */}
          <div 
            className="mt-12 text-center"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s ease-out 0.5s'
            }}
          >
            <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full px-6 py-3 shadow-sm">
              <Lock className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Segurança de nível bancário:</span>{" "}
                isolamento rigoroso de dados e auditoria completa de acessos
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
