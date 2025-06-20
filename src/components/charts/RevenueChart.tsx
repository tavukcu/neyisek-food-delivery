'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  height?: number;
  color?: string;
}

export default function RevenueChart({ data, height = 300, color = "#10b981" }: RevenueChartProps) {
  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'revenue') {
      return [`₺${value.toLocaleString()}`, 'Gelir'];
    }
    if (name === 'percentage') {
      return [`%${value.toFixed(1)}`, 'Oran'];
    }
    return [value, name];
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="category" 
            stroke="#6b7280"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            formatter={formatTooltipValue}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Bar 
            dataKey="revenue" 
            fill={color}
            name="Gelir"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 