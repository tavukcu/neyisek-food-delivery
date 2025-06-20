import { useState, useEffect, useCallback } from 'react';
import { UserPresenceService, UserPresence } from '@/services/userPresenceService';
import { useAuth } from './useAuth';

// Mevcut kullanıcının presence'ını yönetme
export function useCurrentUserPresence() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (user && !isInitialized) {
      UserPresenceService.setUserOnline(user.uid, user);
      setIsInitialized(true);
    }

    return () => {
      if (user && isInitialized) {
        UserPresenceService.setUserOffline(user.uid);
      }
    };
  }, [user, isInitialized]);

  return { isInitialized };
}

// Online kullanıcıları dinleme
export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = UserPresenceService.subscribeToOnlineUsers((users) => {
      setOnlineUsers(users);
      setLoading(false);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getOnlineUsersByRole = useCallback((role?: string) => {
    if (!role) return onlineUsers;
    return onlineUsers.filter(user => user.userInfo.role === role);
  }, [onlineUsers]);

  const getOnlineAdmins = useCallback(() => {
    return onlineUsers.filter(user => user.userInfo.isAdmin);
  }, [onlineUsers]);

  const getOnlineCustomers = useCallback(() => {
    return onlineUsers.filter(user => !user.userInfo.isAdmin && user.userInfo.role !== 'restaurant');
  }, [onlineUsers]);

  const getOnlineRestaurants = useCallback(() => {
    return onlineUsers.filter(user => user.userInfo.role === 'restaurant');
  }, [onlineUsers]);

  return {
    onlineUsers,
    loading,
    error,
    getOnlineUsersByRole,
    getOnlineAdmins,
    getOnlineCustomers,
    getOnlineRestaurants,
    totalOnlineUsers: onlineUsers.length
  };
}

// Tüm kullanıcıların presence bilgilerini getiren hook
export function useAllUserPresence() {
  const [allUsers, setAllUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const users = await UserPresenceService.getAllUsersPresence();
        setAllUsers(users);
      } catch (error) {
        console.error('Kullanıcılar yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();

    // Real-time güncellemeler için interval
    const interval = setInterval(loadUsers, 30000); // 30 saniye

    return () => clearInterval(interval);
  }, []);

  // İstatistikleri hesapla
  const getUserStats = () => {
    const total = allUsers.length;
    const online = allUsers.filter(u => UserPresenceService.isUserOnline(u)).length;
    const customers = allUsers.filter(u => !u.userInfo.isAdmin && u.userInfo.role !== 'restaurant').length;
    const restaurants = allUsers.filter(u => u.userInfo.role === 'restaurant').length;
    const admins = allUsers.filter(u => u.userInfo.isAdmin).length;
    
    // Online kullanıcıların rol bazlı dağılımı
    const onlineUsers = allUsers.filter(u => UserPresenceService.isUserOnline(u));
    const onlineCustomers = onlineUsers.filter(u => !u.userInfo.isAdmin && u.userInfo.role !== 'restaurant').length;
    const onlineRestaurants = onlineUsers.filter(u => u.userInfo.role === 'restaurant').length;
    const onlineAdmins = onlineUsers.filter(u => u.userInfo.isAdmin).length;

    return {
      total,
      online,
      offline: total - online,
      customers,
      restaurants,
      admins,
      onlineCustomers,
      onlineRestaurants,
      onlineAdmins
    };
  };

  return {
    allUsers,
    loading,
    getUserStats
  };
}

// Belirli bir kullanıcının presence'ını dinleme
export function useUserPresence(userId: string) {
  const [userPresence, setUserPresence] = useState<UserPresence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = UserPresenceService.subscribeToUserPresence(userId, (presence) => {
      setUserPresence(presence);
      setLoading(false);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const isOnline = userPresence ? UserPresenceService.isUserOnline(userPresence) : false;
  const lastSeenText = userPresence ? UserPresenceService.formatLastSeen(userPresence.lastSeen) : '';

  return {
    userPresence,
    isOnline,
    lastSeenText,
    loading,
    error
  };
} 