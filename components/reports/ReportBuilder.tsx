'use client'

import React, { useState } from 'react'
import { Plus, X, Database, Filter, Group, Calculator, Save, Play, Code } from 'lucide-react'

export type DataSource = 'users' | 'content' | 'transactions' | 'analytics' | 'logs'
export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct'
export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between'

interface DataField {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  label: string
}

interface QueryFilter {
  id: string
  field: string
  operator: FilterOperator
  value: string | number | [string | number, string | number]
}

interface QueryGroup {
  field: string
  aggregations: Array<{
    field: string
    type: AggregationType
    alias?: string
  }>
}

interface ReportQuery {
  name: string
  description: string
  dataSources: DataSource[]
  selectedFields: string[]
  filters: QueryFilter[]
  groupBy?: string[]
  aggregations?: QueryGroup[]
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>
  limit?: number
}

const dataSourceFields: Record<DataSource, DataField[]> = {
  users: [
    { name: 'id', type: 'string', label: 'User ID' },
    { name: 'email', type: 'string', label: 'Email' },
    { name: 'created_at', type: 'date', label: 'Registration Date' },
    { name: 'last_login', type: 'date', label: 'Last Login' },
    { name: 'status', type: 'string', label: 'Status' },
    { name: 'role', type: 'string', label: 'Role' }
  ],
  content: [
    { name: 'id', type: 'string', label: 'Content ID' },
    { name: 'title', type: 'string', label: 'Title' },
    { name: 'type', type: 'string', label: 'Type' },
    { name: 'author_id', type: 'string', label: 'Author ID' },
    { name: 'created_at', type: 'date', label: 'Created Date' },
    { name: 'views', type: 'number', label: 'View Count' },
    { name: 'likes', type: 'number', label: 'Like Count' }
  ],
  transactions: [
    { name: 'id', type: 'string', label: 'Transaction ID' },
    { name: 'user_id', type: 'string', label: 'User ID' },
    { name: 'amount', type: 'number', label: 'Amount' },
    { name: 'currency', type: 'string', label: 'Currency' },
    { name: 'status', type: 'string', label: 'Status' },
    { name: 'created_at', type: 'date', label: 'Date' }
  ],
  analytics: [
    { name: 'event_type', type: 'string', label: 'Event Type' },
    { name: 'user_id', type: 'string', label: 'User ID' },
    { name: 'session_id', type: 'string', label: 'Session ID' },
    { name: 'page_url', type: 'string', label: 'Page URL' },
    { name: 'timestamp', type: 'date', label: 'Timestamp' },
    { name: 'duration', type: 'number', label: 'Duration (ms)' }
  ],
  logs: [
    { name: 'level', type: 'string', label: 'Log Level' },
    { name: 'message', type: 'string', label: 'Message' },
    { name: 'source', type: 'string', label: 'Source' },
    { name: 'timestamp', type: 'date', label: 'Timestamp' },
    { name: 'user_id', type: 'string', label: 'User ID' },
    { name: 'ip_address', type: 'string', label: 'IP Address' }
  ]
}

interface ReportBuilderProps {
  onSave?: (query: ReportQuery) => void
  onTest?: (query: ReportQuery) => Promise<any[]>
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({ onSave, onTest }) => {
  const [query, setQuery] = useState<ReportQuery>({
    name: '',
    description: '',
    dataSources: [],
    selectedFields: [],
    filters: [],
    groupBy: [],
    limit: 100
  })

  const [showSQL, setShowSQL] = useState(false)
  const [testResults, setTestResults] = useState<any[] | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const availableFields = query.dataSources.flatMap(source =>
    dataSourceFields[source].map(field => ({
      ...field,
      fullName: `${source}.${field.name}`
    }))
  )

  const handleAddDataSource = (source: DataSource) => {
    if (!query.dataSources.includes(source)) {
      setQuery({
        ...query,
        dataSources: [...query.dataSources, source]
      })
    }
  }

  const handleRemoveDataSource = (source: DataSource) => {
    setQuery({
      ...query,
      dataSources: query.dataSources.filter(s => s !== source),
      selectedFields: query.selectedFields.filter(f => !f.startsWith(`${source}.`))
    })
  }

  const handleToggleField = (fieldName: string) => {
    setQuery({
      ...query,
      selectedFields: query.selectedFields.includes(fieldName)
        ? query.selectedFields.filter(f => f !== fieldName)
        : [...query.selectedFields, fieldName]
    })
  }

  const handleAddFilter = () => {
    const newFilter: QueryFilter = {
      id: Date.now().toString(),
      field: availableFields[0]?.fullName || '',
      operator: 'equals',
      value: ''
    }
    setQuery({
      ...query,
      filters: [...query.filters, newFilter]
    })
  }

  const handleRemoveFilter = (filterId: string) => {
    setQuery({
      ...query,
      filters: query.filters.filter(f => f.id !== filterId)
    })
  }

  const handleTestQuery = async () => {
    if (onTest) {
      setIsTesting(true)
      try {
        const results = await onTest(query)
        setTestResults(results)
      } catch (error) {
        console.error('Test failed:', error)
        setTestResults([])
      } finally {
        setIsTesting(false)
      }
    }
  }

  const generateSQL = () => {
    const fields = query.selectedFields.length > 0
      ? query.selectedFields.join(', ')
      : '*'

    const tables = query.dataSources.join(', ')

    const whereClause = query.filters.length > 0
      ? ' WHERE ' + query.filters.map(f => {
          const op = f.operator === 'equals' ? '='
            : f.operator === 'not_equals' ? '!='
            : f.operator === 'contains' ? 'LIKE'
            : f.operator === 'greater_than' ? '>'
            : f.operator === 'less_than' ? '<'
            : 'BETWEEN'

          const value = f.operator === 'contains' ? `'%${f.value}%'`
            : typeof f.value === 'string' ? `'${f.value}'`
            : f.value

          return `${f.field} ${op} ${value}`
        }).join(' AND ')
      : ''

    const groupByClause = query.groupBy && query.groupBy.length > 0
      ? ` GROUP BY ${query.groupBy.join(', ')}`
      : ''

    const limitClause = query.limit ? ` LIMIT ${query.limit}` : ''

    return `SELECT ${fields}\nFROM ${tables}${whereClause}${groupByClause}${limitClause};`
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Custom Report Builder</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Report Name
            </label>
            <input
              type="text"
              value={query.name}
              onChange={(e) => setQuery({ ...query, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Monthly User Activity"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={query.description}
              onChange={(e) => setQuery({ ...query, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tracks user engagement metrics"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Data Sources
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(dataSourceFields).map((source) => (
                <button
                  key={source}
                  onClick={() =>
                    query.dataSources.includes(source as DataSource)
                      ? handleRemoveDataSource(source as DataSource)
                      : handleAddDataSource(source as DataSource)
                  }
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    query.dataSources.includes(source as DataSource)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {source}
                  {query.dataSources.includes(source as DataSource) && (
                    <X className="inline-block w-3 h-3 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {availableFields.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Select Fields
              </h3>
              <div className="max-h-48 overflow-y-auto bg-gray-900 rounded-md p-3 border border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableFields.map((field) => (
                    <label key={field.fullName} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={query.selectedFields.includes(field.fullName)}
                        onChange={() => handleToggleField(field.fullName)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-300">
                        {field.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </h3>
            <div className="space-y-2">
              {query.filters.map((filter) => (
                <div key={filter.id} className="flex items-center space-x-2">
                  <select
                    value={filter.field}
                    onChange={(e) => {
                      const updated = query.filters.map(f =>
                        f.id === filter.id ? { ...f, field: e.target.value } : f
                      )
                      setQuery({ ...query, filters: updated })
                    }}
                    className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableFields.map(field => (
                      <option key={field.fullName} value={field.fullName}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filter.operator}
                    onChange={(e) => {
                      const updated = query.filters.map(f =>
                        f.id === filter.id ? { ...f, operator: e.target.value as FilterOperator } : f
                      )
                      setQuery({ ...query, filters: updated })
                    }}
                    className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="between">Between</option>
                  </select>
                  <input
                    type="text"
                    value={filter.value as string}
                    onChange={(e) => {
                      const updated = query.filters.map(f =>
                        f.id === filter.id ? { ...f, value: e.target.value } : f
                      )
                      setQuery({ ...query, filters: updated })
                    }}
                    className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Value"
                  />
                  <button
                    onClick={() => handleRemoveFilter(filter.id)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddFilter}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Filter
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Result Limit
            </label>
            <input
              type="number"
              value={query.limit}
              onChange={(e) => setQuery({ ...query, limit: parseInt(e.target.value) })}
              className="w-32 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10000"
            />
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-850">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-3">
            <button
              onClick={handleTestQuery}
              disabled={query.dataSources.length === 0 || isTesting}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 mr-2" />
              {isTesting ? 'Testing...' : 'Test Query'}
            </button>
            <button
              onClick={() => setShowSQL(!showSQL)}
              className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <Code className="w-4 h-4 mr-2" />
              {showSQL ? 'Hide SQL' : 'Show SQL'}
            </button>
          </div>
          <button
            onClick={() => onSave && onSave(query)}
            disabled={!query.name || query.dataSources.length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Report
          </button>
        </div>

        {showSQL && (
          <div className="mb-4 p-4 bg-gray-900 rounded-md border border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Generated SQL</h4>
            <pre className="text-sm text-gray-400 font-mono whitespace-pre-wrap">
              {generateSQL()}
            </pre>
          </div>
        )}

        {testResults !== null && (
          <div className="p-4 bg-gray-900 rounded-md border border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Test Results ({testResults.length} rows)
            </h4>
            {testResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {Object.keys(testResults[0]).map(key => (
                        <th key={key} className="text-left px-2 py-1 text-gray-400">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b border-gray-800">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-2 py-1 text-gray-300">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {testResults.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Showing first 5 of {testResults.length} rows
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No results found</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}