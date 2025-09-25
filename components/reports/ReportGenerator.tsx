'use client'

import React, { useState, useCallback } from 'react'
import { Calendar, Download, FileText, TrendingUp, Users, ShoppingCart, Clock, Filter, ChevronDown } from 'lucide-react'
import { ExportButton, ExportFormat } from '../admin/ExportButton'

export type ReportType = 'user-activity' | 'revenue' | 'content' | 'performance' | 'security' | 'custom'
export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

interface ReportConfig {
  type: ReportType
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  metrics: string[]
  supportedFormats: ExportFormat[]
}

const reportConfigs: Record<ReportType, ReportConfig> = {
  'user-activity': {
    type: 'user-activity',
    title: 'User Activity Report',
    description: 'Track user signups, logins, and engagement metrics',
    icon: Users,
    metrics: ['New Users', 'Active Users', 'Login Count', 'Session Duration', 'Page Views'],
    supportedFormats: ['csv', 'xlsx', 'pdf']
  },
  'revenue': {
    type: 'revenue',
    title: 'Revenue Report',
    description: 'Analyze revenue, transactions, and payment metrics',
    icon: TrendingUp,
    metrics: ['Total Revenue', 'Transaction Count', 'Average Order Value', 'Refunds', 'Payment Methods'],
    supportedFormats: ['csv', 'xlsx', 'pdf']
  },
  'content': {
    type: 'content',
    title: 'Content Report',
    description: 'Monitor content creation, moderation, and engagement',
    icon: FileText,
    metrics: ['Posts Created', 'Comments', 'Likes', 'Shares', 'Moderation Actions'],
    supportedFormats: ['csv', 'xlsx', 'pdf']
  },
  'performance': {
    type: 'performance',
    title: 'Performance Report',
    description: 'System performance, API metrics, and error rates',
    icon: Clock,
    metrics: ['Response Time', 'Error Rate', 'API Calls', 'Database Queries', 'Cache Hit Rate'],
    supportedFormats: ['csv', 'xlsx', 'json']
  },
  'security': {
    type: 'security',
    title: 'Security Report',
    description: 'Security events, failed logins, and suspicious activities',
    icon: Filter,
    metrics: ['Failed Logins', 'Security Events', 'Blocked IPs', 'Permission Changes', 'Admin Actions'],
    supportedFormats: ['csv', 'xlsx', 'pdf']
  },
  'custom': {
    type: 'custom',
    title: 'Custom Report',
    description: 'Build your own report with selected metrics',
    icon: FileText,
    metrics: [],
    supportedFormats: ['csv', 'xlsx', 'json', 'pdf']
  }
}

export interface ReportGeneratorProps {
  onGenerate?: (reportType: ReportType, dateRange: DateRange, format: ExportFormat) => Promise<void>
  className?: string
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  onGenerate,
  className = ''
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('user-activity')
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGeneratedReport, setLastGeneratedReport] = useState<{ type: ReportType; date: string } | null>(null)

  const config = reportConfigs[selectedReport]
  const Icon = config.icon

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (onGenerate) {
      setIsGenerating(true)
      try {
        await onGenerate(selectedReport, dateRange, format)
        setLastGeneratedReport({
          type: selectedReport,
          date: new Date().toISOString()
        })
      } catch (error) {
        console.error('Failed to generate report:', error)
      } finally {
        setIsGenerating(false)
      }
    }
  }, [selectedReport, dateRange, onGenerate])

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    )
  }

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Generate Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(reportConfigs).map(([key, config]) => {
                const ReportIcon = config.icon
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedReport(key as ReportType)}
                    className={`
                      flex items-start p-3 rounded-lg border transition-all
                      ${selectedReport === key
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white'
                      }
                    `}
                  >
                    <ReportIcon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{config.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {config.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {dateRange === 'custom' && (
              <div className="mt-3 space-y-2">
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="End date"
                />
              </div>
            )}

            {selectedReport === 'custom' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Metrics
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.values(reportConfigs)
                    .filter(c => c.type !== 'custom')
                    .flatMap(c => c.metrics)
                    .filter((metric, index, self) => self.indexOf(metric) === index)
                    .map(metric => (
                      <label key={metric} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedMetrics.includes(metric)}
                          onChange={() => handleMetricToggle(metric)}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-300">{metric}</span>
                      </label>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-850">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Report Preview</h3>
            <div className="flex items-center space-x-4">
              <Icon className="w-8 h-8 text-gray-500" />
              <div>
                <p className="text-white font-medium">{config.title}</p>
                <p className="text-sm text-gray-400">
                  {config.metrics.length > 0
                    ? `Includes ${config.metrics.length} metrics`
                    : selectedMetrics.length > 0
                    ? `${selectedMetrics.length} metrics selected`
                    : 'No metrics selected'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ExportButton
              onExport={handleExport}
              formats={config.supportedFormats}
              variant="dropdown"
              loading={isGenerating}
              disabled={selectedReport === 'custom' && selectedMetrics.length === 0}
            />
          </div>
        </div>

        {lastGeneratedReport && lastGeneratedReport.type === selectedReport && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-md">
            <p className="text-sm text-green-300">
              Report generated successfully at {new Date(lastGeneratedReport.date).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}