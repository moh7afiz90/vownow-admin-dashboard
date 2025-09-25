'use client'

import React, { useState } from 'react'
import { Clock, Calendar, Mail, Plus, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react'
import { ReportType } from './ReportGenerator'

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'
export type DeliveryMethod = 'email' | 'webhook' | 'storage'

export interface ScheduledReport {
  id: string
  name: string
  reportType: ReportType
  frequency: ScheduleFrequency
  deliveryMethod: DeliveryMethod
  recipients: string[]
  enabled: boolean
  lastRun?: string
  nextRun: string
  createdAt: string
}

interface ScheduledReportsProps {
  reports?: ScheduledReport[]
  onAdd?: (report: Omit<ScheduledReport, 'id' | 'createdAt' | 'lastRun' | 'nextRun'>) => void
  onEdit?: (id: string, report: Partial<ScheduledReport>) => void
  onDelete?: (id: string) => void
  onToggle?: (id: string, enabled: boolean) => void
}

export const ScheduledReports: React.FC<ScheduledReportsProps> = ({
  reports = [],
  onAdd,
  onEdit,
  onDelete,
  onToggle
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    reportType: 'user-activity' as ReportType,
    frequency: 'weekly' as ScheduleFrequency,
    deliveryMethod: 'email' as DeliveryMethod,
    recipients: [''],
    enabled: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onAdd) {
      onAdd({
        ...formData,
        recipients: formData.recipients.filter(r => r.trim())
      })
    }
    setFormData({
      name: '',
      reportType: 'user-activity',
      frequency: 'weekly',
      deliveryMethod: 'email',
      recipients: [''],
      enabled: true
    })
    setShowAddForm(false)
  }

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...formData.recipients]
    newRecipients[index] = value
    setFormData({ ...formData, recipients: newRecipients })
  }

  const addRecipient = () => {
    setFormData({ ...formData, recipients: [...formData.recipients, ''] })
  }

  const removeRecipient = (index: number) => {
    const newRecipients = formData.recipients.filter((_, i) => i !== index)
    setFormData({ ...formData, recipients: newRecipients })
  }

  const frequencyLabels: Record<ScheduleFrequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly'
  }

  const reportTypeLabels: Record<ReportType, string> = {
    'user-activity': 'User Activity',
    'revenue': 'Revenue',
    'content': 'Content',
    'performance': 'Performance',
    'security': 'Security',
    'custom': 'Custom'
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Scheduled Reports</h2>
            <p className="text-sm text-gray-400 mt-1">
              Configure automated report generation and delivery
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">New Scheduled Report</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Report Type
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value as ReportType })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(reportTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as ScheduleFrequency })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Delivery Method
                </label>
                <select
                  value={formData.deliveryMethod}
                  onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value as DeliveryMethod })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="webhook">Webhook</option>
                  <option value="storage">Cloud Storage</option>
                </select>
              </div>
            </div>

            {formData.deliveryMethod === 'email' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipients
                </label>
                {formData.recipients.map((recipient, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => handleRecipientChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com"
                      required
                    />
                    {formData.recipients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="ml-2 p-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRecipient}
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  + Add another recipient
                </button>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Schedule
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="p-6">
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No scheduled reports yet</p>
            <p className="text-sm mt-1">Create your first scheduled report to automate delivery</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-white">{report.name}</h3>
                      {report.enabled ? (
                        <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 ml-2 text-gray-500" />
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <span className="ml-2 text-gray-300">
                          {reportTypeLabels[report.reportType]}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Frequency:</span>
                        <span className="ml-2 text-gray-300">
                          {frequencyLabels[report.frequency]}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Delivery:</span>
                        <span className="ml-2 text-gray-300 capitalize">
                          {report.deliveryMethod}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Next Run:</span>
                        <span className="ml-2 text-gray-300">
                          {new Date(report.nextRun).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {report.recipients && report.recipients.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-400">Recipients:</span>
                        <span className="ml-2 text-gray-300">
                          {report.recipients.join(', ')}
                        </span>
                      </div>
                    )}

                    {report.lastRun && (
                      <div className="mt-2 text-xs text-gray-500">
                        Last run: {new Date(report.lastRun).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onToggle && onToggle(report.id, !report.enabled)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        report.enabled
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {report.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => setEditingId(report.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(report.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}