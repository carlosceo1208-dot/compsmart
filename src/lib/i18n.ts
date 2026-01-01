import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from '@/locales/pt-BR.json';
import esLATAM from '@/locales/es-LATAM.json';
import enUS from '@/locales/en-US.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'es-LATAM', name: 'Español (Latinoamérica)', flag: '🇲🇽' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

const resources = {
  'pt-BR': { translation: ptBR },
  'es-LATAM': { translation: esLATAM },
  'en-US': { translation: enUS },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'es-LATAM', 'en-US'],
    
    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Keys to lookup language from
      lookupLocalStorage: 'compsmart-language',
      // Cache user language
      caches: ['localStorage'],
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
