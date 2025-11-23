import { Shield, Lock, Globe, FileCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function SecurityFooter() {
  const certifications = [
    { name: "ISO 27001", icon: Shield, description: "Segurança da Informação" },
    { name: "GDPR", icon: Globe, description: "Privacidade de Dados (Europa)" },
    { name: "SOC 2", icon: Lock, description: "Controles de Segurança" },
    { name: "LGPD", icon: FileCheck, description: "Lei Geral de Proteção de Dados" },
  ];

  return (
    <footer className="border-t bg-muted/30 py-6 mt-12">
      <div className="container px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Título */}
          <div className="text-center">
            <h3 className="text-sm font-semibold mb-1">
              Segurança e Conformidade
            </h3>
            <p className="text-xs text-muted-foreground">
              Certificações de Segurança e Conformidade de Nível Empresarial
            </p>
          </div>

          {/* Certificações */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {certifications.map((cert) => (
              <div 
                key={cert.name}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border hover:border-primary/50 transition-colors"
              >
                <cert.icon className="w-4 h-4 text-primary" />
                <div className="text-left">
                  <p className="text-xs font-semibold">{cert.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {cert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-2 w-1/2" />

          {/* Aviso Legal */}
          <div className="text-center max-w-2xl">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              O CompSmart utiliza isolamento de dados em nível de aplicação e banco de dados 
              para garantir que informações de cada empresa sejam acessíveis apenas por seus 
              respectivos usuários autorizados. Todas as consultas aos Agentes Smart são 
              privadas e não compartilham dados entre empresas clientes.
            </p>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CompSmart. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
