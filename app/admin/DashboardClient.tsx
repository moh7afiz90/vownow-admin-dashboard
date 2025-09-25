'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, TrendingUp, Activity, DollarSign, UserCheck } from 'lucide-react';
import StatsCard from '@/components/admin/dashboard/StatsCard';
import RecentActivity from '@/components/admin/dashboard/RecentActivity';
import UserChart from '@/components/admin/dashboard/UserChart';
import RevenueChart from '@/components/admin/dashboard/RevenueChart';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  emailsCollected: number;
  conversionRate: number;
  monthlyRevenue: number;
  questionnairesCompleted: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    emailsCollected: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    questionnairesCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/analytics/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your application metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend="+12%"
          trendUp={true}
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          icon={Activity}
          trend="+8%"
          trendUp={true}
        />
        <StatsCard
          title="Emails Collected"
          value={stats.emailsCollected.toLocaleString()}
          icon={Mail}
          trend="+23%"
          trendUp={true}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          trend="+2.3%"
          trendUp={true}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue}`}
          icon={DollarSign}
          trend="N/A"
          trendUp={false}
        />
        <StatsCard
          title="Questionnaires"
          value={stats.questionnairesCompleted.toLocaleString()}
          icon={UserCheck}
          trend="+15%"
          trendUp={true}
        />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserChart />
        <RevenueChart />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Export User Data
            </button>
            <button className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
              Generate Report
            </button>
            <button className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
              View Logs
            </button>
            <button className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}