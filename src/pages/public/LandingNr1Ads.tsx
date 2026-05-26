import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import LandingNr1 from './LandingNr1';

/**
 * URL comercial dedicada para campanhas de anúncios (Google Ads, Meta, LinkedIn).
 * Rota: /landing-nr1
 *
 * Diferenciais vs /nr1:
 *  - Title/description otimizados para CTR de anúncios pagos
 *  - Captura e persiste parâmetros UTM (utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid)
 *    em sessionStorage para serem enviados junto com o lead
 *  - Canonical aponta para /nr1 (evita conteúdo duplicado no SEO orgânico)
 *  - noindex para não competir com a landing orgânica
 */
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

export default function LandingNr1Ads() {
  const [params] = useSearchParams();

  useEffect(() => {
    const captured: Record<string, string> = {};
    UTM_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) captured[k] = v;
    });
    if (Object.keys(captured).length > 0) {
      try {
        sessionStorage.setItem('nr1_ads_attribution', JSON.stringify({ ...captured, landed_at: new Date().toISOString(), landing: '/landing-nr1' }));
      } catch {}
    } else if (!sessionStorage.getItem('nr1_ads_attribution')) {
      try {
        sessionStorage.setItem('nr1_ads_attribution', JSON.stringify({ utm_source: 'direct-ads', landed_at: new Date().toISOString(), landing: '/landing-nr1' }));
      } catch {}
    }
  }, [params]);

  return (
    <>
      <Helmet>
        <title>NR-1 Inteligente: diagnóstico grátis em 5 minutos | CompSmart</title>
        <meta
          name="description"
          content="Cumpra a NR-1 e proteja sua empresa de multas até R$ 4.025/colaborador. Diagnóstico gratuito, PGR pronto e plano de ação em minutos. Teste agora."
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://www.compsmart.ia.br/nr1" />
        <meta property="og:title" content="NR-1 Inteligente — Diagnóstico Grátis | CompSmart" />
        <meta
          property="og:description"
          content="Diagnóstico NR-1 gratuito em 5 minutos. PGR, plano de ação por ROI e proteção contra multas. Comece agora."
        />
        <meta property="og:url" content="https://www.compsmart.ia.br/landing-nr1" />
        <meta property="og:type" content="website" />
      </Helmet>
      <LandingNr1 />
    </>
  );
}
