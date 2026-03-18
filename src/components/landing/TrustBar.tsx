import { Shield, Clock, Users, Award } from "lucide-react";

const trustItems = [
  {
    icon: Users,
    value: "100+",
    label: "Empresas interessadas",
  },
  {
    icon: Clock,
    value: "30 dias",
    label: "Teste grátis",
  },
  {
    icon: Shield,
    value: "100%",
    label: "Dados protegidos",
  },
  {
    icon: Award,
    value: "LGPD",
    label: "Conformidade total",
  },
];

export const TrustBar = () => {
  return (
    <section className="py-8 bg-gradient-to-r from-primary/5 via-background to-primary/5 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {trustItems.map((item, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-2xl md:text-3xl font-bold text-foreground">
                  {item.value}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
