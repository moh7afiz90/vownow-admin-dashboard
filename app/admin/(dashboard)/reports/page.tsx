'use client'

import { useState } from 'react'
import { ReportGenerator } from '@/components/reports/ReportGenerator'
import { ScheduledReports, ScheduledReport } from '@/components/reports/ScheduledReports'
import { ReportBuilder } from '@/components/reports/ReportBuilder'
import { downloadData, prepareTableData, formatDate, formatNumber } from '@/lib/export-utils'
import { ExportFormat } from '@/components/admin/ExportButton'

type TabType = 'generate' | 'scheduled' | 'builder'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('generate')
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Weekly User Report',
      reportType: 'user-activity',
      frequency: 'weekly',
      deliveryMethod: 'email',
      recipients: ['admin@example.com'],
      enabled: true,
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      name: 'Monthly Revenue Summary',
      reportType: 'revenue',
      frequency: 'monthly',
      deliveryMethod: 'storage',
      recipients: [],
      enabled: true,
      nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  ])

  const handleGenerateReport = async (
    reportType: string,
    dateRange: string,
    format: ExportFormat
  ) => {
    const mockData = generateMockData(reportType)

    const exportData = prepareTableData(mockData, [
      { key: 'date', label: 'Date' },
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
      { key: 'change', label: 'Change %' }
    ])

    await downloadData(format, {
      ...exportData,
      filename: `${reportType}-report-${formatDate(new Date())}`,
      title: `${reportType.replace('-', ' ').toUpperCase()} Report`,
      metadata: {
        'Generated': formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        'Date Range': dateRange,
        'Total Records': mockData.length.toString()
      }
    })
  }

  const handleAddScheduledReport = (report: Omit<ScheduledReport, 'id' | 'createdAt' | 'lastRun' | 'nextRun'>) => {
    const newReport: ScheduledReport = {
      ...report,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      nextRun: calculateNextRun(report.frequency)
    }
    setScheduledReports([...scheduledReports, newReport])
  }

  const handleToggleScheduledReport = (id: string, enabled: boolean) => {
    setScheduledReports(reports =>
      reports.map(r => r.id === id ? { ...r, enabled } : r)
    )
  }

  const handleDeleteScheduledReport = (id: string) => {
    setScheduledReports(reports => reports.filter(r => r.id !== id))
  }

  const handleTestQuery = async (query: any) => {
    return generateMockQueryResults()
  }

  const handleSaveReport = (query: any) => {
    console.log('Saving report query:', query)
  }

  const tabs = [
    { id: 'generate' as TabType, label: 'Generate Reports', count: null },
    { id: 'scheduled' as TabType, label: 'Scheduled Reports', count: scheduledReports.length },
    { id: 'builder' as TabType, label: 'Report Builder', count: null }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-gray-400 mt-1">Generate, schedule, and customize reports</p>
      </div>

      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'generate' && (
          <ReportGenerator onGenerate={handleGenerateReport} />
        )}

        {activeTab === 'scheduled' && (
          <ScheduledReports
            reports={scheduledReports}
            onAdd={handleAddScheduledReport}
            onToggle={handleToggleScheduledReport}
            onDelete={handleDeleteScheduledReport}
          />
        )}

        {activeTab === 'builder' && (
          <ReportBuilder
            onTest={handleTestQuery}
            onSave={handleSaveReport}
          />
        )}
      </div>
    </div>
  )
}

function generateMockData(reportType: string) {
  const data = []
  const metrics = {
    'user-activity': ['New Users', 'Active Users', 'Session Duration'],
    'revenue': ['Total Revenue', 'Transactions', 'Average Order Value'],
    'content': ['Posts Created', 'Comments', 'Engagement Rate'],
    'performance': ['Response Time', 'API Calls', 'Error Rate'],
    'security': ['Failed Logins', 'Blocked IPs', 'Security Events']
  }

  const selectedMetrics = metrics[reportType as keyof typeof metrics] || ['Metric 1', 'Metric 2', 'Metric 3']

  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    selectedMetrics.forEach(metric => {
      data.push({
        date: formatDate(date),
        metric,
        value: Math.floor(Math.random() * 10000),
        change: (Math.random() * 20 - 10).toFixed(2)
      })
    })
  }

  return data
}

function generateMockQueryResults() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `USR-${1000 + i}`,
    email: `user${i + 1}@example.com`,
    created_at: formatDate(new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)),
    last_login: formatDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)),
    status: Math.random() > 0.8 ? 'inactive' : 'active',
    total_spent: formatNumber(Math.random() * 10000, { decimals: 2, prefix: '$' })
  }))
}

function calculateNextRun(frequency: string): string {
  const now = new Date()
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1)
      break
    case 'weekly':
      now.setDate(now.getDate() + 7)
      break
    case 'monthly':
      now.setMonth(now.getMonth() + 1)
      break
    case 'quarterly':
      now.setMonth(now.getMonth() + 3)
      break
  }
  return now.toISOString()
}