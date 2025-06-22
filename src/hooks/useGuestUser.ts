import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface GuestUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  isGuest: true;
  sessionId: string;
  createdAt: Date;
}

export interface GuestSession {
  sessionId: string;
  guestUser: GuestUser | null;
  createdAt: Date;
  expiresAt: Date;
}

const GUEST_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 saat
const STORAGE_KEY = 'neyisek-guest-session';

export function useGuestUser() {
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Session'ı localStorage'dan yükle
  useEffect(() => {
    const loadGuestSession = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const session: GuestSession = JSON.parse(stored);
          
          // Session'ın süresi dolmuş mu kontrol et
          if (new Date() < new Date(session.expiresAt)) {
            setGuestSession({
              ...session,
              createdAt: new Date(session.createdAt),
              expiresAt: new Date(session.expiresAt),
              guestUser: session.guestUser ? {
                ...session.guestUser,
                createdAt: new Date(session.guestUser.createdAt)
              } : null
            });
          } else {
            // Süresi dolmuş session'ı temizle
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Guest session yükleme hatası:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadGuestSession();
  }, []);

  // Yeni guest session oluştur
  const createGuestSession = (): string => {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + GUEST_SESSION_DURATION);
    
    const newSession: GuestSession = {
      sessionId,
      guestUser: null,
      createdAt: now,
      expiresAt
    };

    setGuestSession(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    
    return sessionId;
  };

  // Guest user bilgilerini güncelle
  const updateGuestUser = (userData: {
    email: string;
    name: string;
    phone: string;
  }) => {
    if (!guestSession) {
      throw new Error('Guest session bulunamadı');
    }

    const guestUser: GuestUser = {
      id: `guest_${guestSession.sessionId}`,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      isGuest: true,
      sessionId: guestSession.sessionId,
      createdAt: new Date()
    };

    const updatedSession: GuestSession = {
      ...guestSession,
      guestUser
    };

    setGuestSession(updatedSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));

    return guestUser;
  };

  // Guest session'ı temizle
  const clearGuestSession = () => {
    setGuestSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Mevcut session'ı al veya yeni oluştur
  const getOrCreateSession = (): string => {
    if (guestSession) {
      return guestSession.sessionId;
    }
    return createGuestSession();
  };

  return {
    guestSession,
    guestUser: guestSession?.guestUser || null,
    isLoading,
    createGuestSession,
    updateGuestUser,
    clearGuestSession,
    getOrCreateSession,
    hasActiveSession: !!guestSession,
    isSessionExpired: guestSession ? new Date() >= new Date(guestSession.expiresAt) : false
  };
} 