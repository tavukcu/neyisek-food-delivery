'use client';

import { useState, useEffect } from 'react';
import { 
  FunnelIcon, 
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  CreditCardIcon,
  TagIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { PaymentMethod, OrderStatus } from '@/types';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export interface FilterOptions {
  dateRange: {
    startDate: Date;
    endDate: Date;
    preset?: string;
  };
  paymentMethods: PaymentMethod[];
  orderStatuses: OrderStatus[];
  customerSegments: string[];
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  deliveryAreas: string[];
  customFilters: {
    minOrderValue?: number;
    maxOrderValue?: number;
    customerType?: 'new' | 'returning' | 'vip' | 'all';
    productTags?: string[];
  };
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
  isOpen: boolean;
  onToggle: () => void;
  availableCategories?: string[];
  availableDeliveryAreas?: string[];
}

const defaultFilters: FilterOptions = {
  dateRange: {
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    preset: 'last30days'
  },
  paymentMethods: [],
  orderStatuses: [],
  customerSegments: [],
  categories: [],
  priceRange: {
    min: 0,
    max: 1000
  },
  deliveryAreas: [],
  customFilters: {
    customerType: 'all'
  }
};

const datePresets = [
  { key: 'today', label: 'Bugün', getValue: () => ({ start: new Date(), end: new Date() }) },
  { key: 'yesterday', label: 'Dün', getValue: () => ({ start: subDays(new Date(), 1), end: subDays(new Date(), 1) }) },
  { key: 'last7days', label: 'Son 7 Gün', getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { key: 'last30days', label: 'Son 30 Gün', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { key: 'thisWeek', label: 'Bu Hafta', getValue: () => ({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) }) },
  { key: 'thisMonth', label: 'Bu Ay', getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { key: 'last3months', label: 'Son 3 Ay', getValue: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
  { key: 'custom', label: 'Özel Tarih', getValue: () => ({ start: new Date(), end: new Date() }) }
];

const paymentMethodOptions = [
  { value: PaymentMethod.CASH, label: 'Kapıda Nakit' },
  { value: PaymentMethod.CREDIT_CARD, label: 'Kapıda Kart' },
  { value: PaymentMethod.ONLINE, label: 'Online Ödeme' }
];

const orderStatusOptions = [
  { value: OrderStatus.PENDING, label: 'Bekliyor' },
  { value: OrderStatus.CONFIRMED, label: 'Onaylandı' },
  { value: OrderStatus.PREPARING, label: 'Hazırlanıyor' },
  { value: OrderStatus.READY, label: 'Hazır' },
  { value: OrderStatus.DELIVERING, label: 'Yolda' },
  { value: OrderStatus.DELIVERED, label: 'Teslim Edildi' },
  { value: OrderStatus.CANCELLED, label: 'İptal Edildi' }
];

const customerSegmentOptions = [
  { value: 'new', label: 'Yeni Müşteriler' },
  { value: 'returning', label: 'Geri Dönen Müşteriler' },
  { value: 'vip', label: 'VIP Müşteriler (₺500+)' },
  { value: 'frequent', label: 'Sık Sipariş Verenler' },
  { value: 'inactive', label: 'Pasif Müşteriler' }
];

const customerTypeOptions = [
  { value: 'all', label: 'Tüm Müşteriler' },
  { value: 'new', label: 'Yeni Müşteriler' },
  { value: 'returning', label: 'Geri Dönen Müşteriler' },
  { value: 'vip', label: 'VIP Müşteriler' }
];

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  onReset,
  isOpen,
  onToggle,
  availableCategories = [],
  availableDeliveryAreas = []
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    // Aktif filtre sayısını hesapla
    let count = 0;
    if (localFilters.paymentMethods.length > 0) count++;
    if (localFilters.orderStatuses.length > 0) count++;
    if (localFilters.customerSegments.length > 0) count++;
    if (localFilters.categories.length > 0) count++;
    if (localFilters.deliveryAreas.length > 0) count++;
    if (localFilters.customFilters.minOrderValue && localFilters.customFilters.minOrderValue > 0) count++;
    if (localFilters.customFilters.maxOrderValue && localFilters.customFilters.maxOrderValue < 1000) count++;
    if (localFilters.customFilters.customerType !== 'all') count++;
    
    setActiveFiltersCount(count);
  }, [localFilters]);

  const handleDatePresetChange = (preset: string) => {
    const presetData = datePresets.find(p => p.key === preset);
    if (presetData) {
      const { start, end } = presetData.getValue();
      const newFilters = {
        ...localFilters,
        dateRange: {
          startDate: start,
          endDate: end,
          preset
        }
      };
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    }
  };

  const handleArrayFilterChange = (
    filterKey: keyof FilterOptions,
    value: string,
    checked: boolean
  ) => {
    const currentArray = localFilters[filterKey] as string[];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    const newFilters = {
      ...localFilters,
      [filterKey]: newArray
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCustomFilterChange = (key: string, value: any) => {
    const newFilters = {
      ...localFilters,
      customFilters: {
        ...localFilters.customFilters,
        [key]: value
      }
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    setLocalFilters(defaultFilters);
    onReset();
  };

  const FilterSection = ({ 
    title, 
    icon: Icon, 
    children 
  }: { 
    title: string; 
    icon: React.ComponentType<any>; 
    children: React.ReactNode; 
  }) => (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </div>
  );

  const CheckboxGroup = ({ 
    options, 
    selectedValues, 
    onChange 
  }: { 
    options: { value: string; label: string }[]; 
    selectedValues: string[]; 
    onChange: (value: string, checked: boolean) => void; 
  }) => (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {options.map((option) => (
        <label key={option.value} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={(e) => onChange(option.value, e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  );

  if (!isOpen) {
    return (
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FunnelIcon className="h-4 w-4" />
          <span>Gelişmiş Filtreler</span>
          {activeFiltersCount > 0 && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Gelişmiş Filtreler</h2>
          {activeFiltersCount > 0 && (
            <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded-full">
              {activeFiltersCount} aktif filtre
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Temizle
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon */}
        <div>
          {/* Tarih Aralığı */}
          <FilterSection title="Tarih Aralığı" icon={CalendarIcon}>
            <div className="space-y-3">
              <select
                value={localFilters.dateRange.preset || 'custom'}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className="w-full form-input text-sm"
              >
                {datePresets.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
              
              {localFilters.dateRange.preset === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={format(localFilters.dateRange.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newFilters = {
                        ...localFilters,
                        dateRange: {
                          ...localFilters.dateRange,
                          startDate: new Date(e.target.value)
                        }
                      };
                      setLocalFilters(newFilters);
                      onFiltersChange(newFilters);
                    }}
                    className="form-input text-sm"
                  />
                  <input
                    type="date"
                    value={format(localFilters.dateRange.endDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newFilters = {
                        ...localFilters,
                        dateRange: {
                          ...localFilters.dateRange,
                          endDate: new Date(e.target.value)
                        }
                      };
                      setLocalFilters(newFilters);
                      onFiltersChange(newFilters);
                    }}
                    className="form-input text-sm"
                  />
                </div>
              )}
            </div>
          </FilterSection>

          {/* Ödeme Yöntemleri */}
          <FilterSection title="Ödeme Yöntemleri" icon={CreditCardIcon}>
            <CheckboxGroup
              options={paymentMethodOptions}
              selectedValues={localFilters.paymentMethods}
              onChange={(value, checked) => handleArrayFilterChange('paymentMethods', value, checked)}
            />
          </FilterSection>

          {/* Sipariş Durumları */}
          <FilterSection title="Sipariş Durumları" icon={ChartBarIcon}>
            <CheckboxGroup
              options={orderStatusOptions}
              selectedValues={localFilters.orderStatuses}
              onChange={(value, checked) => handleArrayFilterChange('orderStatuses', value, checked)}
            />
          </FilterSection>
        </div>

        {/* Orta Kolon */}
        <div>
          {/* Müşteri Segmentleri */}
          <FilterSection title="Müşteri Segmentleri" icon={UserGroupIcon}>
            <CheckboxGroup
              options={customerSegmentOptions}
              selectedValues={localFilters.customerSegments}
              onChange={(value, checked) => handleArrayFilterChange('customerSegments', value, checked)}
            />
          </FilterSection>

          {/* Kategoriler */}
          {availableCategories.length > 0 && (
            <FilterSection title="Kategoriler" icon={TagIcon}>
              <CheckboxGroup
                options={availableCategories.map(cat => ({ value: cat, label: cat }))}
                selectedValues={localFilters.categories}
                onChange={(value, checked) => handleArrayFilterChange('categories', value, checked)}
              />
            </FilterSection>
          )}

          {/* Teslimat Alanları */}
          {availableDeliveryAreas.length > 0 && (
            <FilterSection title="Teslimat Alanları" icon={MapPinIcon}>
              <CheckboxGroup
                options={availableDeliveryAreas.map(area => ({ value: area, label: area }))}
                selectedValues={localFilters.deliveryAreas}
                onChange={(value, checked) => handleArrayFilterChange('deliveryAreas', value, checked)}
              />
            </FilterSection>
          )}
        </div>

        {/* Sağ Kolon */}
        <div>
          {/* Özel Filtreler */}
          <FilterSection title="Özel Filtreler" icon={FunnelIcon}>
            <div className="space-y-4">
              {/* Müşteri Tipi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri Tipi
                </label>
                <select
                  value={localFilters.customFilters.customerType || 'all'}
                  onChange={(e) => handleCustomFilterChange('customerType', e.target.value)}
                  className="w-full form-input text-sm"
                >
                  {customerTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Sipariş Tutarı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min. Sipariş Tutarı (₺)
                </label>
                <input
                  type="number"
                  min="0"
                  value={localFilters.customFilters.minOrderValue || ''}
                  onChange={(e) => handleCustomFilterChange('minOrderValue', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full form-input text-sm"
                  placeholder="0"
                />
              </div>

              {/* Maksimum Sipariş Tutarı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max. Sipariş Tutarı (₺)
                </label>
                <input
                  type="number"
                  min="0"
                  value={localFilters.customFilters.maxOrderValue || ''}
                  onChange={(e) => handleCustomFilterChange('maxOrderValue', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full form-input text-sm"
                  placeholder="1000"
                />
              </div>
            </div>
          </FilterSection>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {activeFiltersCount > 0 ? `${activeFiltersCount} filtre aktif` : 'Filtre seçilmedi'}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Tümünü Temizle
          </button>
          <button
            onClick={onToggle}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
          >
            Filtreleri Uygula
          </button>
        </div>
      </div>
    </div>
  );
} 