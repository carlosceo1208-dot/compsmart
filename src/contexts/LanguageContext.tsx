import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  isLoading: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'compsmart-language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user's preferred language from database on login
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!userId) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', userId)
          .single();

        if (profile?.preferred_language && profile.preferred_language !== i18n.language) {
          await i18n.changeLanguage(profile.preferred_language);
          localStorage.setItem(STORAGE_KEY, profile.preferred_language);
        }
      } catch (error) {
        console.error('Error loading user language preference:', error);
      }
    };

    loadUserLanguage();
  }, [userId, i18n]);

  // Load company default language as fallback
  useEffect(() => {
    const loadCompanyDefaultLanguage = async () => {
      if (!userId) return;

      try {
        // Get user's root company
        const { data: profile } = await supabase
          .from('profiles')
          .select('root_company_id')
          .eq('id', userId)
          .single();

        if (!profile?.root_company_id) return;

        // Check if user has a preference set
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', userId)
          .single();

        // If user has no preference, use company default
        if (!userProfile?.preferred_language) {
          const { data: company } = await supabase
            .from('organizational_structure')
            .select('default_language')
            .eq('id', profile.root_company_id)
            .single();

          if (company?.default_language) {
            await i18n.changeLanguage(company.default_language);
            localStorage.setItem(STORAGE_KEY, company.default_language);
          }
        }
      } catch (error) {
        console.error('Error loading company default language:', error);
      }
    };

    loadCompanyDefaultLanguage();
  }, [userId, i18n]);

  const changeLanguage = useCallback(async (lang: SupportedLanguage) => {
    setIsLoading(true);
    try {
      // Always update i18n and localStorage
      await i18n.changeLanguage(lang);
      localStorage.setItem(STORAGE_KEY, lang);

      // If authenticated, also save to database
      if (isAuthenticated && userId) {
        await supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  }, [i18n, isAuthenticated, userId]);

  const value: LanguageContextType = {
    currentLanguage: i18n.language as SupportedLanguage,
    changeLanguage,
    isLoading,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
