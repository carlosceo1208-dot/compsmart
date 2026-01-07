import { useState, useEffect } from 'react';
import { getBrazilDateString } from '@/lib/timezone';

const LAUNCH_DATE = '2026-01-07';

export const useLaunchDay = () => {
  const [hasSeenConfetti, setHasSeenConfetti] = useState(true);
  
  useEffect(() => {
    const seen = sessionStorage.getItem('launch_confetti_seen');
    setHasSeenConfetti(!!seen);
  }, []);

  const today = getBrazilDateString();
  const isLaunchDay = today === LAUNCH_DATE;
  
  const shouldShowConfetti = isLaunchDay && !hasSeenConfetti;
  
  const markConfettiSeen = () => {
    sessionStorage.setItem('launch_confetti_seen', 'true');
    setHasSeenConfetti(true);
  };
  
  return { 
    isLaunchDay, 
    shouldShowConfetti, 
    markConfettiSeen,
    launchDate: LAUNCH_DATE
  };
};
