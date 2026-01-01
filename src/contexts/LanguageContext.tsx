import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import i18n, { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  isLoading: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'compsmart-language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(i18n.language as SupportedLanguage);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLang(lng as SupportedLanguage);
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);
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
          .select('*')
          .eq('id', userId)
          .single();

        // Cast to access new column that may not be in types yet
        const preferredLanguage = (profile as any)?.preferred_language as string | null;
        
        if (preferredLanguage && preferredLanguage !== i18n.language) {
          await i18n.changeLanguage(preferredLanguage);
          localStorage.setItem(STORAGE_KEY, preferredLanguage);
        }
      } catch (error) {
        console.error('Error loading user language preference:', error);
      }
    };

    loadUserLanguage();
  }, [userId]);

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
          .select('*')
          .eq('id', userId)
          .single();

        // Cast to access new column
        const userPreferredLang = (userProfile as any)?.preferred_language as string | null;

        // If user has no preference, use company default
        if (!userPreferredLang) {
          const { data: company } = await supabase
            .from('organizational_structure')
            .select('*')
            .eq('id', profile.root_company_id)
            .single();

          // Cast to access new column
          const companyDefaultLang = (company as any)?.default_language as string | null;

          if (companyDefaultLang) {
            await i18n.changeLanguage(companyDefaultLang);
            localStorage.setItem(STORAGE_KEY, companyDefaultLang);
          }
        }
      } catch (error) {
        console.error('Error loading company default language:', error);
      }
    };

    loadCompanyDefaultLanguage();
  }, [userId]);

  const changeLanguage = useCallback(async (lang: SupportedLanguage) => {
    console.log('[i18n] changeLanguage called with:', lang);
    console.log('[i18n] Current i18n.language BEFORE:', i18n.language);
    
    setIsLoading(true);
    try {
      // Always update i18n and localStorage
      await i18n.changeLanguage(lang);
      
      console.log('[i18n] i18n.language AFTER changeLanguage:', i18n.language);
      
      // Force state update to trigger re-renders
      setCurrentLang(lang);
      
      localStorage.setItem(STORAGE_KEY, lang);
      console.log('[i18n] localStorage set to:', localStorage.getItem(STORAGE_KEY));

      // If authenticated, also save to database
      if (isAuthenticated && userId) {
        // Use raw update to handle new column not in types
        await supabase
          .from('profiles')
          .update({ preferred_language: lang } as any)
          .eq('id', userId);
        console.log('[i18n] Saved to database for user:', userId);
      }
      
      console.log('[i18n] Language change complete. Final i18n.language:', i18n.language);
    } catch (error) {
      console.error('[i18n] Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

  const value: LanguageContextType = {
    currentLanguage: currentLang,
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
