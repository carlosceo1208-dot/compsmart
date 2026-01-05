import compsmartLogo from "@/assets/compsmart-logo.png";
import { Linkedin, Instagram, Mail, MapPin } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-12 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <img src={compsmartLogo} alt="CompSmart" className="h-20 w-auto object-contain mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Plataforma de gestão estratégica de remuneração e benefícios com apoio da inteligência artificial.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.linkedin.com/company/compsmart-tecnologia-servicos-de-rh/" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Linkedin className="h-5 w-5 text-primary" />
              </a>
              <a 
                href="https://www.instagram.com/compsmart.ia.br/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Instagram className="h-5 w-5 text-primary" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Produto</h3>
            <ul className="space-y-2">
              <li>
                <a href="#solution" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Preços
                </a>
              </li>
              <li>
                <a href="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Demonstração
                </a>
              </li>
              <li>
                <a href="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Começar Grátis
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Recursos</h3>
            <ul className="space-y-2">
              <li>
                <a href="/glossary" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Glossário de C&S
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:contato@compsmart.ia.br" className="hover:text-primary transition-colors">
                  contato@compsmart.ia.br
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:suporte@compsmart.ia.br" className="hover:text-primary transition-colors">
                  suporte@compsmart.ia.br
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>São Paulo, Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} CompSmart. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a href="/termos-de-uso" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </a>
              <a href="/politica-de-privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidade
              </a>
              <a href="/politica-de-privacidade#lgpd" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                LGPD
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
