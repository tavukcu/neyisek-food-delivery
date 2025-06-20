'use client';

import { useCurrentUserPresence } from '@/hooks/useUserPresence';
import { useAuth } from '@/hooks/useAuth';

export default function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Kullanıcı giriş yapmışsa presence sistemini başlat
  useCurrentUserPresence();

  return <>{children}</>;
} 