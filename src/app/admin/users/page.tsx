'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Star,
  ShoppingCart,
  DollarSign,
  ArrowLeft,
  MoreVertical,
  Ban,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import BackToHomeButton from '@/components/BackToHomeButton';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Kullanıcı tipi
interface User {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  isVerified: boolean;
  totalOrders: number;
  totalSpent: number;
  averageRating: number;
  addresses: any[];
  favoriteRestaurants: string[];
  role: 'customer' | 'restaurant' | 'admin';
  status: 'active' | 'suspended' | 'banned';
}

// Kullanıcı Kartı Bileşeni
const UserCard = ({ user, onViewDetails, onEdit, onToggleStatus }: {
  user: User;
  onViewDetails: (user: User) => void;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'restaurant': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            {user.phone && (
              <p className="text-xs text-gray-500">{user.phone}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
            {user.status === 'active' ? 'Aktif' : user.status === 'suspended' ? 'Askıda' : 'Yasaklı'}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
            {user.role === 'admin' ? 'Admin' : user.role === 'restaurant' ? 'Restoran' : 'Müşteri'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{user.totalOrders}</p>
          <p className="text-xs text-gray-600">Sipariş</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">₺{user.totalSpent}</p>
          <p className="text-xs text-gray-600">Harcama</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{user.averageRating || 0}/5</p>
          <p className="text-xs text-gray-600">Puan</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('tr-TR') : 'Hiç'}
          </p>
          <p className="text-xs text-gray-600">Son Giriş</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(user)}
          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Detaylar
        </button>
        <button
          onClick={() => onEdit(user)}
          className="flex-1 bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Düzenle
        </button>
        <button
          onClick={() => onToggleStatus(user)}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            user.status === 'active' 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          {user.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {user.status === 'active' ? 'Askıya Al' : 'Aktifleştir'}
        </button>
      </div>
    </div>
  );
};

// Kullanıcı Detay Modal Bileşeni
const UserDetailModal = ({ user, onClose }: { user: User | null; onClose: () => void }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Kullanıcı Detayları</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Temel Bilgiler */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Temel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Ad Soyad</label>
                <p className="text-gray-900">{user.displayName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">E-posta</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Telefon</label>
                <p className="text-gray-900">{user.phone || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Kayıt Tarihi</label>
                <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">İstatistikler</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <ShoppingCart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{user.totalOrders}</p>
                <p className="text-sm text-blue-600">Toplam Sipariş</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">₺{user.totalSpent}</p>
                <p className="text-sm text-green-600">Toplam Harcama</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{user.averageRating || 0}/5</p>
                <p className="text-sm text-yellow-600">Ortalama Puan</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Activity className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{user.favoriteRestaurants.length}</p>
                <p className="text-sm text-purple-600">Favori Restoran</p>
              </div>
            </div>
          </div>

          {/* Adresler */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Adresler</h3>
            {user.addresses.length > 0 ? (
              <div className="space-y-2">
                {user.addresses.map((address, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-900">{address.city}, {address.district}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Kayıtlı adres bulunmuyor</p>
            )}
          </div>

          {/* Durum Bilgileri */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Durum Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {user.isActive ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                  {user.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {user.isVerified ? (
                  <UserCheck className="h-5 w-5 text-blue-600" />
                ) : (
                  <UserX className="h-5 w-5 text-gray-600" />
                )}
                <span className={user.isVerified ? 'text-blue-600' : 'text-gray-600'}>
                  {user.isVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">
                  Son giriş: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('tr-TR') : 'Hiç'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

// Ana Kullanıcı Yönetimi Bileşeni
export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Kullanıcıları yükle
  useEffect(() => {
    if (user && user.isAdmin) {
      loadUsers();
    }
  }, [user]);

  // Filtreleme
  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Kullanıcıları Firebase'den yükle
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: User[] = [];

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          displayName: data.displayName || 'İsimsiz Kullanıcı',
          email: data.email || '',
          phone: data.phoneNumber || '',
          photoURL: data.photoURL,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate(),
          isActive: data.isActive !== false,
          isVerified: data.emailVerified || false,
          totalOrders: data.totalOrders || 0,
          totalSpent: data.totalSpent || 0,
          averageRating: data.averageRating || 0,
          addresses: data.addresses || [],
          favoriteRestaurants: data.favoriteRestaurants || [],
          role: data.role || 'customer',
          status: data.status || 'active'
        });
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      toast.error('Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtreleme
  const filterUsers = () => {
    let filtered = users;

    // Arama
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm))
      );
    }

    // Rol filtresi
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  // Kullanıcı durumu değiştir
  const handleToggleStatus = (targetUser: User) => {
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    setUsers(prev => prev.map(u => 
      u.id === targetUser.id 
        ? { ...u, status: newStatus }
        : u
    ));
    toast.success(`Kullanıcı ${newStatus === 'active' ? 'aktifleştirildi' : 'askıya alındı'}`);
  };

  // Kullanıcı düzenle
  const handleEdit = (user: User) => {
    toast('Düzenleme özelliği yakında eklenecek', { icon: 'ℹ️' });
  };

  // İstatistikler
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    customers: users.filter(u => u.role === 'customer').length,
    restaurants: users.filter(u => u.role === 'restaurant').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  if (authLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container-responsive py-6">
        {/* Başlık */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
            </div>
            <p className="text-gray-600">Tüm kullanıcıları görüntüleyin ve yönetin</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              Dışa Aktar
            </button>
            <BackToHomeButton variant="secondary" />
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-600">Aktif Kullanıcı</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.customers}</p>
                <p className="text-sm text-gray-600">Müşteri</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.restaurants}</p>
                <p className="text-sm text-gray-600">Restoran</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
                <p className="text-sm text-gray-600">Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Arama ve Filtreler */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Kullanıcı ara (ad, e-posta, telefon)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Roller</option>
              <option value="customer">Müşteri</option>
              <option value="restaurant">Restoran</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="suspended">Askıda</option>
              <option value="banned">Yasaklı</option>
            </select>
          </div>
        </div>

        {/* Kullanıcı Listesi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onViewDetails={setSelectedUser}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Kullanıcı bulunamadı</h3>
            <p className="text-gray-600">Arama kriterlerinizi değiştirmeyi deneyin.</p>
          </div>
        )}
      </div>

      {/* Kullanıcı Detay Modal */}
      <UserDetailModal 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />
    </main>
  );
} 