'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';

interface SalesChartProps {
  data: { date: string; revenue: number; orders: number }[];
  type?: 'line' | 'bar';
  height?: number;
}

export default function SalesChart({ data, type = 'line', height = 300 }: SalesChartProps) {
  // Veriyi formatla
  const formattedData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'dd/MM'),
    revenue: Math.round(item.revenue),
    orders: item.orders
  }));

  const formatCurrency = (value: number) => `₺${value.toLocaleString('tr-TR')}`;
  const formatNumber = (value: number) => value.toString();

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            yAxisId="revenue"
            orientation="left"
            stroke="#10b981"
            fontSize={12}
            tickFormatter={formatCurrency}
          />
          <YAxis 
            yAxisId="orders"
            orientation="right"
            stroke="#3b82f6"
            fontSize={12}
            tickFormatter={formatNumber}
          />
          <Tooltip 
            formatter={(value, name) => [
              name === 'revenue' ? formatCurrency(value as number) : formatNumber(value as number),
              name === 'revenue' ? 'Gelir' : 'Sipariş Sayısı'
            ]}
            labelFormatter={(label) => `Tarih: ${label}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Bar 
            yAxisId="revenue"
            dataKey="revenue" 
            fill="#10b981" 
            name="Gelir"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="orders"
            dataKey="orders" 
            fill="#3b82f6" 
            name="Sipariş Sayısı"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          stroke="#666"
          fontSize={12}
        />
        <YAxis 
          yAxisId="revenue"
          orientation="left"
          stroke="#10b981"
          fontSize={12}
          tickFormatter={formatCurrency}
        />
        <YAxis 
          yAxisId="orders"
          orientation="right"
          stroke="#3b82f6"
          fontSize={12}
          tickFormatter={formatNumber}
        />
        <Tooltip 
          formatter={(value, name) => [
            name === 'revenue' ? formatCurrency(value as number) : formatNumber(value as number),
            name === 'revenue' ? 'Gelir' : 'Sipariş Sayısı'
          ]}
          labelFormatter={(label) => `Tarih: ${label}`}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
        <Line 
          yAxisId="revenue"
          type="monotone" 
          dataKey="revenue" 
          stroke="#10b981" 
          strokeWidth={3}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
          name="Gelir"
        />
        <Line 
          yAxisId="orders"
          type="monotone" 
          dataKey="orders" 
          stroke="#3b82f6" 
          strokeWidth={3}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          name="Sipariş Sayısı"
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 