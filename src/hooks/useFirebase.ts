import { useState, useEffect, useCallback } from 'react';
import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Order, User } from '@/types';
import { ProductService } from '@/services/productService';
import { OrderService } from '@/services/orderService';
import { UserService } from '@/services/userService';

// Ürünleri real-time dinleme hook'u
export function useProducts(categoryId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    let unsubscribe: Unsubscribe;

    try {
      unsubscribe = ProductService.subscribeToProducts(
        categoryId || null,
        (updatedProducts) => {
          setProducts(updatedProducts);
          setLoading(false);
          setError(null);
        }
      );
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [categoryId]);

  return { products, loading, error };
}

// Kullanıcı siparişlerini real-time dinleme hook'u
export function useUserOrders(userId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: Unsubscribe;

    try {
      unsubscribe = OrderService.subscribeToUserOrders(
        userId,
        (updatedOrders) => {
          setOrders(updatedOrders);
          setLoading(false);
          setError(null);
        }
      );
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);

  return { orders, loading, error };
}

// Kategorileri getirme hook'u
export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await ProductService.getAllCategories();
        setCategories(categoriesData);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

// Kullanıcıları getirme hook'u (Admin için)
export function useUsers(role?: 'customer' | 'restaurant' | 'admin') {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      let usersData: User[];
      
      if (role) {
        usersData = await UserService.getUsersByRole(role);
      } else {
        usersData = await UserService.getAllUsers();
      }
      
      setUsers(usersData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}

// Real-time bağlantı durumu hook'u
export function useFirebaseConnection() {
  const [isConnected, setIsConnected] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Network durumunu dinle
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Firebase bağlantı durumunu dinle
    const connectedRef = collection(db, '.info/connected');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isConnected, isOnline };
}

// Batch operations hook'u
export function useBatchOperations() {
  const [loading, setLoading] = useState(false);

  const createMultipleProducts = async (products: any[]) => {
    setLoading(true);
    try {
      const promises = products.map(product => ProductService.createProduct(product));
      await Promise.all(promises);
    } finally {
      setLoading(false);
    }
  };

  const updateMultipleOrders = async (orderUpdates: { id: string; updates: any }[]) => {
    setLoading(true);
    try {
      const promises = orderUpdates.map(({ id, updates }) => 
        OrderService.updateOrderStatus(id, updates.status)
      );
      await Promise.all(promises);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createMultipleProducts,
    updateMultipleOrders
  };
} 