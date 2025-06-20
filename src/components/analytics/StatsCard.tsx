'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeLabel,
  color = 'primary',
  loading = false 
}: StatsCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return {
          bg: 'bg-primary-100',
          icon: 'text-primary-600',
          text: 'text-primary-600'
        };
      case 'secondary':
        return {
          bg: 'bg-secondary-100',
          icon: 'text-secondary-600',
          text: 'text-secondary-600'
        };
      case 'success':
        return {
          bg: 'bg-green-100',
          icon: 'text-green-600',
          text: 'text-green-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100',
          icon: 'text-yellow-600',
          text: 'text-yellow-600'
        };
      case 'danger':
        return {
          bg: 'bg-red-100',
          icon: 'text-red-600',
          text: 'text-red-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-100',
          icon: 'text-blue-600',
          text: 'text-blue-600'
        };
      default:
        return {
          bg: 'bg-gray-100',
          icon: 'text-gray-600',
          text: 'text-gray-600'
        };
    }
  };

  const colorClasses = getColorClasses(color);

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString('tr-TR');
    }
    return val;
  };

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
          <div className={`${colorClasses.bg} rounded-full p-3`}>
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
        </div>
        <div className={`${colorClasses.bg} rounded-full p-3`}>
          <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
        </div>
      </div>
      
      {change !== undefined && (
        <div className="mt-4 flex items-center">
          {change >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-sm text-gray-600 ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
} 