'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface SalesChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
    previousPeriod?: number;
  }>;
  height?: number;
  showComparison?: boolean;
}

export default function SalesChart({ data, height = 300, showComparison = false }: SalesChartProps) {
  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'revenue' || name === 'previousPeriod') {
      return [`₺${value.toLocaleString()}`, name === 'revenue' ? 'Gelir' : 'Önceki Dönem'];
    }
    return [value, name === 'orders' ? 'Sipariş' : name];
  };

  const formatXAxisLabel = (tickItem: string) => {
    try {
      return format(new Date(tickItem), 'dd/MM');
    } catch {
      return tickItem;
    }
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            formatter={formatTooltipValue}
            labelFormatter={(label) => `Tarih: ${formatXAxisLabel(label)}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            name="Gelir"
          />
          <Line 
            type="monotone" 
            dataKey="orders" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
            yAxisId="right"
            name="Sipariş"
          />
          {showComparison && (
            <Line 
              type="monotone" 
              dataKey="previousPeriod" 
              stroke="#6b7280" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#6b7280', strokeWidth: 2, r: 3 }}
              name="Önceki Dönem"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 