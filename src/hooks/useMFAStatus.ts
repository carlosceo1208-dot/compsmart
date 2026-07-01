import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  created_at: string;
  updated_at: string;
}

interface MFAStatus {
  hasMFA: boolean;
  factors: MFAFactor[];
  isLoading: boolean;
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
  refetch: () => Promise<void>;
}

export function useMFAStatus(): MFAStatus {
  const [hasMFA, setHasMFA] = useState(false);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState<'aal1' | 'aal2' | null>(null);
  const [nextLevel, setNextLevel] = useState<'aal1' | 'aal2' | null>(null);

  const fetchMFAStatus = async () => {
    setIsLoading(true);
    try {
      // Get factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error('Error fetching MFA factors:', factorsError);
        return;
      }

      const verifiedFactors = (factorsData?.totp || []).filter(
        (f) => f.status === 'verified'
      ) as MFAFactor[];
      
      setFactors(verifiedFactors);
      setHasMFA(verifiedFactors.length > 0);

      // Get assurance level
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalError) {
        console.error('Error fetching AAL:', aalError);
        return;
      }

      setCurrentLevel((aalData?.currentLevel as 'aal1' | 'aal2') || null);
      setNextLevel((aalData?.nextLevel as 'aal1' | 'aal2') || null);

    } catch (error) {
      console.error('Error in useMFAStatus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  return {
    hasMFA,
    factors,
    isLoading,
    currentLevel,
    nextLevel,
    refetch: fetchMFAStatus,
  };
}
