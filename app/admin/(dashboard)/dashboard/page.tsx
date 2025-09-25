'use client'

import React from 'react'
import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react'
import { MetricCard } from '@/components/admin/MetricCard'
import { TrendIndicator } from '@/components/admin/TrendIndicator'
import { WidgetGrid } from '@/components/admin/WidgetGrid'
import { LineChart } from '@/components/admin/charts/LineChart'
import { BarChart } from '@/components/admin/charts/BarChart'
import { PieChart } from '@/components/admin/charts/PieChart'
import { AreaChart } from '@/components/admin/charts/AreaChart'

// Mock data for the dashboard
const mockMetrics = [
  {
    title: 'Total Users',
    value: '12,543',
    change: '+5.2%',
    trend: 'up' as const,
    icon: 'Users',
    description: 'Active users in the last 30 days'
  },
  {
    title: 'Revenue',
    value: '$45,678',
    change: '+12.3%',
    trend: 'up' as const,
    icon: 'DollarSign',
    description: 'Total revenue this month'
  },
  {
    title: 'Conversion Rate',
    value: '3.4%',
    change: '-0.8%',
    trend: 'down' as const,
    icon: 'TrendingUp',
    description: 'Conversion rate this month'
  },
  {
    title: 'Active Sessions',
    value: '892',
    change: '0%',
    trend: 'neutral' as const,
    icon: 'Activity',
    description: 'Currently active sessions'
  }
]

const mockLineData = [
  { name: 'Jan', revenue: 4000, users: 240, conversions: 140 },
  { name: 'Feb', revenue: 3000, users: 139, conversions: 150 },
  { name: 'Mar', revenue: 2000, users: 980, conversions: 320 },
  { name: 'Apr', revenue: 2780, users: 390, conversions: 280 },
  { name: 'May', revenue: 1890, users: 480, conversions: 200 },
  { name: 'Jun', revenue: 2390, users: 380, conversions: 250 },
  { name: 'Jul', revenue: 3490, users: 430, conversions: 300 }
]

const mockBarData = [
  { name: 'Desktop', users: 400, sessions: 600 },
  { name: 'Mobile', users: 300, sessions: 450 },
  { name: 'Tablet', users: 200, sessions: 300 },
  { name: 'Other', users: 100, sessions: 150 }
]

const mockPieData = [
  { name: 'Direct', value: 400, color: '#8884d8' },
  { name: 'Social Media', value: 300, color: '#82ca9d' },
  { name: 'Search', value: 200, color: '#ffc658' },
  { name: 'Email', value: 100, color: '#ff7c7c' },
  { name: 'Referral', value: 80, color: '#8dd1e1' }
]

const mockAreaData = [
  { name: 'Jan', pageViews: 4000, uniqueVisitors: 2400, bounceRate: 2400 },
  { name: 'Feb', pageViews: 3000, uniqueVisitors: 1398, bounceRate: 2210 },
  { name: 'Mar', pageViews: 2000, uniqueVisitors: 9800, bounceRate: 2290 },
  { name: 'Apr', pageViews: 2780, uniqueVisitors: 3908, bounceRate: 2000 },
  { name: 'May', pageViews: 1890, uniqueVisitors: 4800, bounceRate: 2181 },
  { name: 'Jun', pageViews: 2390, uniqueVisitors: 3800, bounceRate: 2500 }
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your admin dashboard. Here's what's happening with your application.
          </p>
        </div>

        {/* Metrics Cards */}
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Key Metrics
          </h2>
          <WidgetGrid columns={4} gap="md" responsive>
            {mockMetrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                trend={metric.trend}
                icon={metric.icon}
                description={metric.description}
                onClick={() => console.log(`Clicked on ${metric.title}`)}
              />
            ))}
          </WidgetGrid>
        </section>

        {/* Trend Indicators Example */}
        <section aria-labelledby="trends-heading">
          <h2 id="trends-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Trend Indicators
          </h2>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex flex-wrap gap-6">
              <TrendIndicator trend="up" value="+5.2%" label="Revenue Growth" size="md" />
              <TrendIndicator trend="down" value="-2.1%" label="Churn Rate" size="md" />
              <TrendIndicator trend="neutral" value="0%" label="Market Share" size="md" />
              <TrendIndicator trend="up" value="+12%" label="User Acquisition" size="lg" />
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section aria-labelledby="charts-heading">
          <h2 id="charts-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Analytics Charts
          </h2>

          <WidgetGrid columns={2} gap="lg" responsive>
            {/* Line Chart */}
            <div className="col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Revenue & User Growth
              </h3>
              <LineChart
                data={mockLineData}
                xDataKey="name"
                lines={[
                  { dataKey: 'revenue', stroke: '#8884d8', name: 'Revenue' },
                  { dataKey: 'users', stroke: '#82ca9d', name: 'Users' },
                  { dataKey: 'conversions', stroke: '#ffc658', name: 'Conversions' }
                ]}
                height={300}
                showLegend
                animated
              />
            </div>

            {/* Bar Chart */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Device Usage
              </h3>
              <BarChart
                data={mockBarData}
                xDataKey="name"
                bars={[
                  { dataKey: 'users', fill: '#8884d8', name: 'Users' },
                  { dataKey: 'sessions', fill: '#82ca9d', name: 'Sessions' }
                ]}
                height={300}
                showLegend
                animated
              />
            </div>

            {/* Pie Chart */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Traffic Sources
              </h3>
              <PieChart
                data={mockPieData}
                dataKey="value"
                nameKey="name"
                height={300}
                showLegend
                showPercentages
                animated
              />
            </div>

            {/* Area Chart */}
            <div className="col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Website Analytics
              </h3>
              <AreaChart
                data={mockAreaData}
                xDataKey="name"
                areas={[
                  { dataKey: 'pageViews', stroke: '#8884d8', fill: '#8884d8', name: 'Page Views' },
                  { dataKey: 'uniqueVisitors', stroke: '#82ca9d', fill: '#82ca9d', name: 'Unique Visitors' },
                  { dataKey: 'bounceRate', stroke: '#ffc658', fill: '#ffc658', name: 'Bounce Rate' }
                ]}
                height={300}
                showLegend
                stacked
                animated
              />
            </div>
          </WidgetGrid>
        </section>

        {/* Loading States Example */}
        <section aria-labelledby="loading-heading">
          <h2 id="loading-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Loading States (Demo)
          </h2>
          <WidgetGrid columns={3} gap="md" responsive>
            <MetricCard
              title="Loading Metric"
              value=""
              isLoading={true}
            />
            <div>
              <LineChart
                data={[]}
                xDataKey="name"
                lines={[]}
                height={200}
                isLoading={true}
              />
            </div>
            <div>
              <PieChart
                data={[]}
                dataKey="value"
                nameKey="name"
                height={200}
                isLoading={true}
              />
            </div>
          </WidgetGrid>
        </section>

        {/* Error States Example */}
        <section aria-labelledby="error-heading">
          <h2 id="error-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Error States (Demo)
          </h2>
          <WidgetGrid columns={2} gap="md" responsive>
            <div>
              <LineChart
                data={null as any}
                xDataKey="name"
                lines={[]}
                height={200}
              />
            </div>
            <div>
              <BarChart
                data={mockBarData}
                xDataKey="name"
                bars={[]}
                height={200}
              />
            </div>
          </WidgetGrid>
        </section>
      </div>
    </div>
  )
}