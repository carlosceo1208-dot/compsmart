import { Shield, Lock, Globe, FileCheck } from "lucide-react";

export function SecurityFooter() {
  const certifications = [
    { name: "ISO 27001", icon: Shield, description: "Segurança da Informação" },
    { name: "GDPR", icon: Globe, description: "Privacidade de Dados (Europa)" },
    { name: "SOC 2", icon: Lock, description: "Controles de Segurança" },
    { name: "LGPD", icon: FileCheck, description: "Lei Geral de Proteção de Dados" },
  ];

  return (
    <footer className="bg-gradient-to-br from-primary via-primary-hover to-primary-dark py-10 mt-12 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)] border-t-2 border-primary-light/10">
      <div className="container px-4">
        <div className="flex flex-col items-center justify-center space-y-6">
          
          {/* Título com toque de verde */}
          <div className="text-center">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2 justify-center">
              <Shield className="w-5 h-5 text-secondary" />
              Segurança e Conformidade
            </h3>
            <p className="text-xs text-white/90 max-w-lg">
              Certificações de Segurança e Conformidade de Nível Empresarial
            </p>
          </div>

          {/* Certificações - Cards com fundo azul mais claro e bordas verdes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
            {certifications.map((cert) => (
              <div 
                key={cert.name}
                className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border-2 border-secondary/40 hover:bg-white/15 hover:border-secondary/60 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                {/* Ícone com fundo verde */}
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center border-2 border-secondary/50">
                  <cert.icon className="w-6 h-6 text-secondary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{cert.name}</p>
                  <p className="text-[10px] text-white/70 mt-0.5">
                    {cert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Separador com gradiente */}
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />

          {/* Aviso Legal */}
          <div className="text-center max-w-3xl bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-xs text-white/85 leading-relaxed">
              O CompSmart utiliza isolamento de dados em nível de aplicação e banco de dados 
              para garantir que informações de cada empresa sejam acessíveis apenas por seus 
              respectivos usuários autorizados. Todas as consultas aos Agentes Smart são 
              privadas e não compartilham dados entre empresas clientes.
            </p>
          </div>

          {/* Copyright com logo */}
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>© {new Date().getFullYear()}</span>
            <span className="text-secondary font-bold">CompSmart</span>
            <span>• Todos os direitos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
