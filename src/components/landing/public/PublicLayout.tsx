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

/** Casca das páginas públicas: menu fixo, rodapé, WhatsApp e SEO por página. */
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
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <PublicHeader />
      <main className="pt-16 md:pt-20">{children}</main>
      <PublicFooter />
      <WhatsAppFloat />
    </div>
  );
};
