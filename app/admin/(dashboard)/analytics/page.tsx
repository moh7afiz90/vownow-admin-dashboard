'use client';

import { Calendar, Download, TrendingUp, Users, Mail, UserCheck, Clock, Activity } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  // TODO: Fetch real data from Supabase
  const conversionData = [
    { name: 'Mon', visitors: 120, signups: 45, conversion: 37.5 },
    { name: 'Tue', visitors: 150, signups: 52, conversion: 34.7 },
    { name: 'Wed', visitors: 180, signups: 68, conversion: 37.8 },
    { name: 'Thu', visitors: 165, signups: 55, conversion: 33.3 },
    { name: 'Fri', visitors: 200, signups: 72, conversion: 36.0 },
    { name: 'Sat', visitors: 145, signups: 48, conversion: 33.1 },
    { name: 'Sun', visitors: 135, signups: 42, conversion: 31.1 },
  ];

  const trafficSources = [
    { name: 'Direct', value: 35, color: '#6366F1' },
    { name: 'Social Media', value: 30, color: '#10B981' },
    { name: 'Search', value: 20, color: '#F59E0B' },
    { name: 'Referral', value: 10, color: '#EF4444' },
    { name: 'Email', value: 5, color: '#8B5CF6' },
  ];

  const engagementData = [
    { time: '00:00', activeUsers: 23 },
    { time: '04:00', activeUsers: 12 },
    { time: '08:00', activeUsers: 45 },
    { time: '12:00', activeUsers: 89 },
    { time: '16:00', activeUsers: 76 },
    { time: '20:00', activeUsers: 102 },
  ];

  const questionnaireFunnel = [
    { stage: 'Started', count: 1000 },
    { stage: 'Q1-3 Completed', count: 850 },
    { stage: 'Q4-6 Completed', count: 720 },
    { stage: 'Q7-10 Completed', count: 600 },
    { stage: 'Finished', count: 450 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Track performance metrics and user engagement</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>Last year</option>
          </select>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Visitors</p>
              <p className="text-2xl font-bold text-white mt-1">12,483</p>
              <p className="text-green-400 text-sm mt-2">+18.2% from last week</p>
            </div>
            <Users className="h-8 w-8 text-indigo-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Conversion Rate</p>
              <p className="text-2xl font-bold text-white mt-1">32.5%</p>
              <p className="text-green-400 text-sm mt-2">+2.3% from last week</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg. Session Duration</p>
              <p className="text-2xl font-bold text-white mt-1">4m 23s</p>
              <p className="text-yellow-400 text-sm mt-2">-12s from last week</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Bounce Rate</p>
              <p className="text-2xl font-bold text-white mt-1">42.3%</p>
              <p className="text-red-400 text-sm mt-2">+3.1% from last week</p>
            </div>
            <Activity className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Conversion Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Area type="monotone" dataKey="visitors" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} name="Visitors" />
              <Area type="monotone" dataKey="signups" stroke="#10B981" fill="#10B981" fillOpacity={0.5} name="Signups" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trafficSources}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {trafficSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement and Questionnaire Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">User Engagement (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Line type="monotone" dataKey="activeUsers" stroke="#F59E0B" strokeWidth={2} name="Active Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Questionnaire Completion Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={questionnaireFunnel} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis type="category" dataKey="stage" stroke="#9CA3AF" width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}