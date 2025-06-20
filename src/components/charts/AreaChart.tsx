'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface AreaChartProps {
  data: Array<{
    date: string;
    newCustomers: number;
    totalCustomers: number;
    revenue?: number;
  }>;
  height?: number;
  showRevenue?: boolean;
}

export default function CustomAreaChart({ data, height = 300, showRevenue = false }: AreaChartProps) {
  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'revenue') {
      return [`₺${value.toLocaleString()}`, 'Gelir'];
    }
    if (name === 'newCustomers') {
      return [value, 'Yeni Müşteri'];
    }
    if (name === 'totalCustomers') {
      return [value, 'Toplam Müşteri'];
    }
    return [value, name];
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
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorNewCustomers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorTotalCustomers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
            {showRevenue && (
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
              </linearGradient>
            )}
          </defs>
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
          <Area
            type="monotone"
            dataKey="newCustomers"
            stackId="1"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorNewCustomers)"
            name="Yeni Müşteri"
          />
          <Area
            type="monotone"
            dataKey="totalCustomers"
            stackId="2"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorTotalCustomers)"
            name="Toplam Müşteri"
          />
          {showRevenue && (
            <Area
              type="monotone"
              dataKey="revenue"
              stackId="3"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Gelir"
              yAxisId="right"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
} 