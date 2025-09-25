'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function UserChart() {
  const [data, setData] = useState<Array<{ date: string; users: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserGrowthData();
  }, []);

  const fetchUserGrowthData = async () => {
    try {
      const response = await fetch('/api/admin/analytics/user-growth');
      if (response.ok) {
        const growthData = await response.json();
        setData(growthData);
      }
    } catch (error) {
      console.error('Error fetching user growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#6366F1"
              name="Total Users"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}