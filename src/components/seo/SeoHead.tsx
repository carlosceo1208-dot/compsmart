import { Helmet } from "react-helmet-async";
import { SEO_BASE_URL, SEO_IMAGE, getSeoRoute } from "@/config/seoRoutes";

interface SeoHeadProps {
  path: string;
  title?: string;
  description?: string;
}

/** Head por página (title, description, canonical, OG, Twitter). Prioriza seoRoutes.ts. */
export const SeoHead = ({ path, title, description }: SeoHeadProps) => {
  const seo = getSeoRoute(path);
  const t = seo?.title ?? title ?? "CompSmart";
  const d = seo?.description ?? description ?? "";
  const url = `${SEO_BASE_URL}${path}`;
  return (
    <Helmet>
      <html lang="pt-BR" />
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={SEO_IMAGE} />
      <meta property="og:image:alt" content="Marca CompSmart — A Inteligência trabalhando com você" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={SEO_IMAGE} />
    </Helmet>
  );
};
