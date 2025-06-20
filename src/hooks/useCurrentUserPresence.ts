import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { UserPresenceService, UserPresence } from '@/services/userPresenceService';

export function useCurrentUserPresence() {
  const { user } = useAuth();
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setPresence(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = UserPresenceService.subscribeToUserPresence(
      user.uid,
      (presenceData) => {
        setPresence(presenceData);
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  return {
    presence,
    isLoading
  };
} 