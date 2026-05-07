import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentUserProfile } from '@/services/UserController';

export default function useLiveUserPoints(refreshIntervalMs = 30000) {
  const [userPoints, setUserPoints] = useState(0);
  const mountedRef = useRef(false);

  const refreshUserPoints = useCallback(async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile && mountedRef.current) {
        setUserPoints(profile.points || 0);
      }
      return profile;
    } catch (error) {
      console.error('Error refreshing user points:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const refreshSafely = async () => {
      if (cancelled) return;
      await refreshUserPoints();
    };

    refreshSafely();

    const interval = window.setInterval(refreshSafely, refreshIntervalMs);
    const handlePointsUpdated = (event) => {
      if (typeof event.detail?.points === 'number') {
        setUserPoints(event.detail.points);
        return;
      }
      refreshSafely();
    };

    window.addEventListener('userPointsUpdated', handlePointsUpdated);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      window.clearInterval(interval);
      window.removeEventListener('userPointsUpdated', handlePointsUpdated);
    };
  }, [refreshIntervalMs, refreshUserPoints]);

  return { userPoints, setUserPoints, refreshUserPoints };
}
