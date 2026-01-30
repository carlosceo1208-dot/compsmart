import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { KudosCategory } from '@/hooks/usePerformanceKudos';

interface KudosNotification {
  id: string;
  message: string;
  category: KudosCategory;
  fromEmployee?: {
    full_name: string;
    avatar_url: string | null;
    job_title: string | null;
  } | null;
}

interface UseKudosNotificationsReturn {
  showConfetti: boolean;
  showPopup: boolean;
  currentKudos: KudosNotification | null;
  dismissNotification: () => void;
  markKudosAsRead: (kudosIds?: string[]) => Promise<void>;
}

export const useKudosNotifications = (): UseKudosNotificationsReturn => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentKudos, setCurrentKudos] = useState<KudosNotification | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('kudos-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'performance_kudos',
          filter: `to_employee_id=eq.${userId}`,
        },
        async (payload) => {
          const newKudos = payload.new as {
            id: string;
            message: string;
            category: KudosCategory;
            from_employee_id: string;
          };

          // Fetch sender info
          const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, job_title')
            .eq('id', newKudos.from_employee_id)
            .single();

          const kudosNotification: KudosNotification = {
            id: newKudos.id,
            message: newKudos.message,
            category: newKudos.category,
            fromEmployee: senderData || null,
          };

          setCurrentKudos(kudosNotification);
          setShowConfetti(true);
          setShowPopup(true);

          // Invalidate header notifications query
          queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
          queryClient.invalidateQueries({ queryKey: ['performance-kudos'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const dismissNotification = useCallback(() => {
    setShowPopup(false);
    // Keep confetti running if still active
    setTimeout(() => {
      setCurrentKudos(null);
    }, 300);
  }, []);

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  const markKudosAsRead = useCallback(async (kudosIds?: string[]) => {
    if (!userId) return;

    try {
      let query = supabase
        .from('performance_kudos')
        .update({ is_read: true })
        .eq('to_employee_id', userId)
        .eq('is_read', false);

      if (kudosIds && kudosIds.length > 0) {
        query = query.in('id', kudosIds);
      }

      await query;

      // Invalidate queries to update counts
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['performance-kudos'] });
    } catch (error) {
      console.error('Error marking kudos as read:', error);
    }
  }, [userId, queryClient]);

  return {
    showConfetti,
    showPopup,
    currentKudos,
    dismissNotification,
    markKudosAsRead,
  };
};
