import { SeoHead } from "@/components/seo/SeoHead";
import { AnnouncementBar } from "@/components/landing/public/AnnouncementBar";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { WhatsAppFloat } from "./WhatsAppFloat";

interface PublicLayoutProps {
  title: string;
  description: string;
  path: string;
  children: React.ReactNode;
}


/** Páginas públicas: menu fixo, rodapé, contato e SEO por página. */
export const PublicLayout = ({
  title,
  description,
  path,
  children,
}: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <SeoHead path={path} title={title} description={description} />
      <PublicHeader />
      <main className="pt-16 md:pt-20 lg:pt-28 xl:pt-20"><AnnouncementBar spacer />{children}</main>
      <PublicFooter />
      <WhatsAppFloat />
    </div>
  );
};
