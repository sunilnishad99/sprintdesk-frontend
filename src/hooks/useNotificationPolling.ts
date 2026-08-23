import { useEffect, useRef } from 'react';
import { notificationService } from '../api/notificationService';
import { useNotificationStore } from '../store/notificationStore';
import { useToast } from './useToast';

const POLL_INTERVAL_MS = 15000; // 15s — frequent enough to demo, gentle enough not to hammer the API

export function useNotificationPolling() {
  const addFromPosts = useNotificationStore((s) => s.addFromPosts);
  const isPanelOpen = useNotificationStore((s) => s.isPanelOpen);
  const hydrateInitial = useNotificationStore((s) => s.hydrateInitial);
  const { toast } = useToast();

  // Keep a ref so the interval callback always sees the latest panel-open
  // state without needing to be recreated every time it changes.
  const isPanelOpenRef = useRef(isPanelOpen);
  isPanelOpenRef.current = isPanelOpen;

  useEffect(() => {
    hydrateInitial();
  }, [hydrateInitial]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        const posts = await notificationService.fetchLatestPosts();
        const fresh = addFromPosts(posts);

        // Only toast for genuinely new arrivals, and only if the person
        // isn't already looking at the panel (avoids a toast + a visibly
        // updating list firing at the same time).
        if (fresh.length > 0 && !isPanelOpenRef.current) {
          toast.info(
            fresh.length === 1
              ? `New notification: ${fresh[0].message.slice(0, 60)}`
              : `${fresh.length} new notifications`,
          );
        }
      } catch {
        // Silently ignore poll failures — a transient network hiccup
        // shouldn't interrupt the person's work with an error toast every
        // 15 seconds.
      }
    };

    const startPolling = () => {
      if (intervalId) return;
      poll(); // fire immediately on (re)start, don't wait a full interval
      intervalId = setInterval(poll, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stopPolling();
      else startPolling();
    };

    if (!document.hidden) startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
