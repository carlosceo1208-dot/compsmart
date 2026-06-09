import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTrackEvent } from '@/hooks/useTrackEvent';

/**
 * Captura automaticamente cada navegação como evento de telemetria.
 * Deriva module_name a partir do primeiro segmento da rota.
 * Não rastreia rotas públicas (auth, landing, checkout) — apenas área logada.
 */
const PUBLIC_PREFIXES = ['/auth', '/forgot-password', '/reset-password', '/activate', '/', '/checkout', '/termos-de-uso', '/politica-de-privacidade', '/sobre-nos', '/glossario', '/changelog'];

const MODULE_MAP: Record<string, string> = {
  dashboard: 'core',
  employees: 'core',
  organization: 'core',
  'salary-ranges': 'core',
  'job-titles': 'core',
  roles: 'core',
  benefits: 'core',
  budget: 'core',
  'people-analytics': 'insight',
  'salary-comparison': 'insight',
  'market-benchmark': 'insight',
  'pay-equity': 'insight',
  'job-matching': 'match',
  performance: 'performance',
  nr1: 'nr1',
  'salary-assistant': 'ai-assistant',
  'legal-assistant': 'ai-assistant',
  'incentive-assistant': 'ai-assistant',
  settings: 'settings',
  'super-admin': 'admin',
};

export const TelemetryTracker = () => {
  const location = useLocation();
  const { track } = useTrackEvent();
  const lastTrackedRef = useRef<string>('');

  useEffect(() => {
    const path = location.pathname;
    if (path === lastTrackedRef.current) return;

    // Skip rotas públicas
    const isPublic = PUBLIC_PREFIXES.some(p => p === path || path.startsWith(p + '/'));
    if (isPublic && path !== '/dashboard') return;

    const firstSegment = path.split('/').filter(Boolean)[0] ?? 'unknown';
    const module = MODULE_MAP[firstSegment] ?? 'other';

    lastTrackedRef.current = path;
    void track({
      event_name: 'page_view',
      event_category: 'navigation',
      module_name: module,
      metadata: { segment: firstSegment },
    });
  }, [location.pathname, track]);

  return null;
};
