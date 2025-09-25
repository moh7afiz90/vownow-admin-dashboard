'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RevenueChart() {
  const [data, setData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const response = await fetch('/api/admin/analytics/revenue');
      if (response.ok) {
        const revenueData = await response.json();
        setData(revenueData.length > 0 ? revenueData : getPlaceholderData());
      } else {
        setData(getPlaceholderData());
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setData(getPlaceholderData());
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholderData = () => [
    { month: 'Jan', revenue: 0 },
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 0 },
    { month: 'May', revenue: 0 },
    { month: 'Jun', revenue: 0 },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Monthly Revenue</h3>
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}