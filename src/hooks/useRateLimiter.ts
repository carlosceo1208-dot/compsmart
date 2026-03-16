import { useState, useCallback, useRef } from "react";

interface RateLimiterConfig {
  maxAttempts: number;
  windowMs: number;
  cooldownMs: number;
}

interface RateLimiterState {
  attempts: number;
  isBlocked: boolean;
  remainingTime: number;
  canAttempt: boolean;
}

export const useRateLimiter = (config: RateLimiterConfig = {
  maxAttempts: 5,
  windowMs: 60000, // 1 minute
  cooldownMs: 30000, // 30 seconds cooldown after max attempts
}) => {
  const [state, setState] = useState<RateLimiterState>({
    attempts: 0,
    isBlocked: false,
    remainingTime: 0,
    canAttempt: true,
  });

  const attemptTimestamps = useRef<number[]>([]);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (cooldownTimer.current) {
      clearTimeout(cooldownTimer.current);
      cooldownTimer.current = null;
    }
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  const startCooldown = useCallback((duration: number) => {
    clearTimers();
    
    const endTime = Date.now() + duration;
    
    setState(prev => ({
      ...prev,
      isBlocked: true,
      canAttempt: false,
      remainingTime: Math.ceil(duration / 1000),
    }));

    countdownTimer.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setState(prev => ({ ...prev, remainingTime: remaining }));
      
      if (remaining <= 0) {
        clearTimers();
        attemptTimestamps.current = [];
        setState({
          attempts: 0,
          isBlocked: false,
          remainingTime: 0,
          canAttempt: true,
        });
      }
    }, 1000);
  }, [clearTimers]);

  const recordAttempt = useCallback((): boolean => {
    const now = Date.now();
    
    // Remove old attempts outside the window
    attemptTimestamps.current = attemptTimestamps.current.filter(
      ts => now - ts < config.windowMs
    );

    // Check if blocked
    if (state.isBlocked) {
      return false;
    }

    // Check if max attempts reached
    if (attemptTimestamps.current.length >= config.maxAttempts) {
      // Calculate progressive cooldown based on attempts
      const cooldownMultiplier = Math.min(attemptTimestamps.current.length - config.maxAttempts + 1, 5);
      const cooldownDuration = config.cooldownMs * cooldownMultiplier;
      startCooldown(cooldownDuration);
      return false;
    }

    // Record the attempt
    attemptTimestamps.current.push(now);
    
    setState(prev => ({
      ...prev,
      attempts: attemptTimestamps.current.length,
      canAttempt: attemptTimestamps.current.length < config.maxAttempts,
    }));

    return true;
  }, [config.maxAttempts, config.windowMs, config.cooldownMs, state.isBlocked, startCooldown]);

  const reset = useCallback(() => {
    clearTimers();
    attemptTimestamps.current = [];
    setState({
      attempts: 0,
      isBlocked: false,
      remainingTime: 0,
      canAttempt: true,
    });
  }, [clearTimers]);

  return {
    ...state,
    recordAttempt,
    reset,
  };
};
