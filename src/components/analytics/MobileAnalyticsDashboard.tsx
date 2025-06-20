'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { DashboardStats } from '@/lib/analytics/analyticsService';
import { format } from 'date-fns';

interface MobileAnalyticsDashboardProps {
  dashboardData: DashboardStats | null;
  isLoading: boolean;
  onRefresh: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  color?: string;
}

const CollapsibleSection = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultExpanded = false,
  color = 'blue'
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800'
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${colorClasses[color as keyof typeof colorClasses]} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <span className="font-medium">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5" />
        ) : (
          <ChevronDownIcon className="h-5 w-5" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

const MobileStatsCard = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon,
  color = 'blue'
}: {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<any>;
  color?: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {change !== undefined && (
          <div className={`text-sm font-medium ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {changeLabel && (
          <p className="text-xs text-gray-500 mt-1">{changeLabel}</p>
        )}
      </div>
    </div>
  );
};

export default function MobileAnalyticsDashboard({ 
  dashboardData, 
  isLoading, 
  onRefresh 
}: MobileAnalyticsDashboardProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (dashboardData) {
      setLastUpdated(new Date());
    }
  }, [dashboardData]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {/* Loading Skeleton */}
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Veri yüklenemedi</p>
        <button 
          onClick={onRefresh}
          className="mt-2 text-blue-600 font-medium"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">📊 Analitik</h1>
          <p className="text-sm text-gray-500">
            Son güncelleme: {format(lastUpdated, 'HH:mm')}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ArrowTrendingUpIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MobileStatsCard
          title="Bugünkü Gelir"
          value={`₺${dashboardData.todayRevenue.toFixed(0)}`}
          change={dashboardData.revenueGrowth}
          changeLabel="önceki aya göre"
          icon={CurrencyDollarIcon}
          color="green"
        />
        <MobileStatsCard
          title="Bugünkü Siparişler"
          value={dashboardData.todayOrders}
          change={dashboardData.orderGrowth}
          changeLabel="önceki aya göre"
          icon={ShoppingCartIcon}
          color="blue"
        />
        <MobileStatsCard
          title="Bekleyen Siparişler"
          value={dashboardData.pendingOrders}
          icon={ChartBarIcon}
          color="orange"
        />
        <MobileStatsCard
          title="Toplam Müşteri"
          value={dashboardData.totalCustomers}
          change={dashboardData.customerGrowth}
          changeLabel="bu ay yeni"
          icon={UsersIcon}
          color="purple"
        />
      </div>

      {/* Detaylı Bölümler */}
      <CollapsibleSection
        title="Satış Performansı"
        icon={ArrowTrendingUpIcon}
        color="green"
        defaultExpanded={true}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Tamamlanan Siparişler</span>
            <span className="font-semibold text-gray-900">{dashboardData.completedOrders}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Gelir Büyümesi</span>
            <span className={`font-semibold ${
              dashboardData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {dashboardData.revenueGrowth >= 0 ? '+' : ''}{dashboardData.revenueGrowth.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Sipariş Büyümesi</span>
            <span className={`font-semibold ${
              dashboardData.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {dashboardData.orderGrowth >= 0 ? '+' : ''}{dashboardData.orderGrowth.toFixed(1)}%
            </span>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Müşteri Analizi"
        icon={UsersIcon}
        color="purple"
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Toplam Müşteri</span>
            <span className="font-semibold text-gray-900">{dashboardData.totalCustomers}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Bu Ay Yeni Müşteri</span>
            <span className="font-semibold text-green-600">{dashboardData.customerGrowth}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Müşteri memnuniyeti için düzenli geri bildirim toplama önerilir.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Ürün Bilgileri"
        icon={ChartBarIcon}
        color="orange"
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Toplam Ürün</span>
            <span className="font-semibold text-gray-900">{dashboardData.totalProducts}</span>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Ürün çeşitliliği müşteri memnuniyetini artırır.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Hızlı Eylemler */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h3 className="font-medium text-gray-900 mb-3">Hızlı Eylemler</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            📊 Detaylı Rapor
          </button>
          <button className="p-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            📧 Rapor Gönder
          </button>
          <button className="p-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            🎯 Hedef Belirle
          </button>
          <button className="p-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            📈 Trend Analizi
          </button>
        </div>
      </div>
    </div>
  );
} 