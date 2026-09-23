import { Helmet } from "react-helmet-async";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { WhatsAppFloat } from "./WhatsAppFloat";

interface PublicLayoutProps {
  title: string;
  description: string;
  path: string;
  children: React.ReactNode;
}

const BASE = "https://www.compsmart.ia.br";

/** Páginas públicas: menu fixo, rodapé, contato e SEO por página. */
export const PublicLayout = ({
  title,
  description,
  path,
  children,
}: PublicLayoutProps) => {
  const url = `${BASE}${path}`;
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={`${BASE}/compsmart-social.png`} />
        <meta property="og:image:alt" content="Marca CompSmart — A Inteligência trabalhando com você" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${BASE}/compsmart-social.png`} />
      </Helmet>
      <PublicHeader />
      <main className="pt-16 md:pt-20">{children}</main>
      <PublicFooter />
      <WhatsAppFloat />
    </div>
  );
};
