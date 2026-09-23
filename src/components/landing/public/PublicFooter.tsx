import { Link } from "react-router-dom";
import { Linkedin, Instagram, Mail } from "lucide-react";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { LANDING_MODULES, CONTACT_EMAIL } from "@/config/landingModules";

export const PublicFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-muted/40 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="py-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src={compsmartLogo}
              alt="CompSmart"
              className="h-16 w-auto object-contain mb-4"
            />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plataforma de Gestão Estratégica de Pessoas: 9 módulos com agentes
              de IA dedicados, que trabalham junto com o seu RH.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://www.linkedin.com/company/compsmart-tecnologia-servi%C3%A7os-de-rh/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Linkedin className="h-4 w-4 text-primary" />
              </a>
              <a
                href="https://www.instagram.com/compsmart.ia.br/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Instagram className="h-4 w-4 text-primary" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-semibold mb-4 text-sm">Módulos</h3>
            <ul className="grid sm:grid-cols-2 gap-2">
              {LANDING_MODULES.map((m) => (
                <li key={m.slug}>
                  <Link
                    to={m.route}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {m.nomeCurto}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Institucional</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/precos" className="hover:text-primary">
                  Preços
                </Link>
              </li>
              <li>
                <Link to="/parceiros" className="hover:text-primary">
                  Parceiros
                </Link>
              </li>
              <li>
                <Link to="/materiais" className="hover:text-primary">
                  Materiais
                </Link>
              </li>
              <li>
                <Link to="/contato" className="hover:text-primary">
                  Contato
                </Link>
              </li>
              <li>
                <Link to="/sobre-nos" className="hover:text-primary">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link to="/termos-de-uso" className="hover:text-primary">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link to="/politica-de-privacidade" className="hover:text-primary">
                  Política de privacidade
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="hover:text-primary inline-flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border py-6 text-xs text-muted-foreground space-y-2">
          <p>
            Tratamos dados pessoais conforme a LGPD (Lei 13.709/2018). As
            respostas de diagnóstico psicossocial são anônimas e reportadas
            apenas por grupo, nunca por pessoa. A plataforma importa dados de
            folha, mas não processa folha de pagamento.
          </p>
          <p>© {year} CompSmart. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
