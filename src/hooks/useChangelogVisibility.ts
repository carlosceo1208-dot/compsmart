import { getBrazilDateString } from '@/lib/timezone';

const CHANGELOG_VISIBLE_DATE = '2026-04-07'; // 90 dias após lançamento (07/01/2026)

export const useChangelogVisibility = () => {
  const today = getBrazilDateString();
  const isChangelogVisible = today >= CHANGELOG_VISIBLE_DATE;
  
  return { 
    isChangelogVisible,
    visibilityDate: CHANGELOG_VISIBLE_DATE
  };
};
