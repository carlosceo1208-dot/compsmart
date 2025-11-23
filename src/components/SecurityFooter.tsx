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
    <footer className="bg-gradient-to-br from-success via-success-hover to-success-dark py-8 mt-12 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.3)]">
      <div className="container px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Título */}
          <div className="text-center">
            <h3 className="text-sm font-bold text-white mb-1">
              Segurança e Conformidade
            </h3>
            <p className="text-xs text-white/90">
              Certificações de Segurança e Conformidade de Nível Empresarial
            </p>
          </div>

          {/* Certificações */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {certifications.map((cert) => (
              <div 
                key={cert.name}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25 hover:border-white/40 transition-all duration-300"
              >
                <cert.icon className="w-5 h-5 text-white" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">{cert.name}</p>
                  <p className="text-[10px] text-white/80">
                    {cert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-2 w-1/2 bg-white/30" />

          {/* Aviso Legal */}
          <div className="text-center max-w-2xl">
            <p className="text-[10px] text-white/80 leading-relaxed">
              O CompSmart utiliza isolamento de dados em nível de aplicação e banco de dados 
              para garantir que informações de cada empresa sejam acessíveis apenas por seus 
              respectivos usuários autorizados. Todas as consultas aos Agentes Smart são 
              privadas e não compartilham dados entre empresas clientes.
            </p>
          </div>

          {/* Copyright */}
          <p className="text-xs text-white/70">
            © {new Date().getFullYear()} CompSmart. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
