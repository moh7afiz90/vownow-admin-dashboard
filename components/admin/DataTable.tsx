import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  X,
  Download,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'

export interface DataTableColumn {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  render?: (value: any, row: any) => React.ReactNode
}

export interface BulkAction {
  key: string
  label: string
  action: (actionKey: string, selectedRows: any[]) => void
}

export interface PaginationConfig {
  pageSize: number
  showPagination?: boolean
  pageSizeOptions?: number[]
}

export interface DataTableProps {
  data: any[]
  columns: DataTableColumn[]
  keyField: string
  isLoading?: boolean
  showFilters?: boolean
  selectable?: boolean
  multiSort?: boolean
  responsive?: boolean
  stackOnMobile?: boolean
  virtualized?: boolean
  pagination?: PaginationConfig
  onSelectionChange?: (selectedIds: any[]) => void
  bulkActions?: BulkAction[]
  className?: string
  emptyMessage?: string
}

type SortConfig = {
  key: string
  direction: 'asc' | 'desc' | 'none'
}

type FilterConfig = Record<string, string>

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  keyField,
  isLoading = false,
  showFilters = false,
  selectable = false,
  multiSort = false,
  responsive = false,
  stackOnMobile = false,
  virtualized = false,
  pagination,
  onSelectionChange,
  bulkActions = [],
  className = '',
  emptyMessage = 'No data available',
}) => {
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([])
  const [filters, setFilters] = useState<FilterConfig>({})
  const [selectedRows, setSelectedRows] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10)
  const [sortAnnouncement, setSortAnnouncement] = useState('')
  const [filterAnnouncement, setFilterAnnouncement] = useState('')

  const tableRef = useRef<HTMLTableElement>(null)

  // Validate required props
  useEffect(() => {
    if (!keyField || !data?.length) return

    const hasValidKeys = data.every(row => row && row.hasOwnProperty(keyField))
    if (!hasValidKeys) {
      console.error('DataTable: Some rows are missing the specified keyField')
    }

    const hasValidColumns = columns.every(col => col.key && col.label)
    if (!hasValidColumns) {
      console.error('DataTable: All columns must have key and label properties')
    }
  }, [data, columns, keyField])

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    setSortConfigs(prev => {
      if (multiSort) {
        const existingIndex = prev.findIndex(config => config.key === columnKey)
        if (existingIndex >= 0) {
          const newConfigs = [...prev]
          const currentDirection = newConfigs[existingIndex].direction
          if (currentDirection === 'none') {
            newConfigs[existingIndex].direction = 'asc'
          } else if (currentDirection === 'asc') {
            newConfigs[existingIndex].direction = 'desc'
          } else {
            newConfigs.splice(existingIndex, 1)
          }
          return newConfigs
        } else {
          return [...prev, { key: columnKey, direction: 'asc' }]
        }
      } else {
        const existing = prev.find(config => config.key === columnKey)
        const currentDirection = existing?.direction || 'none'
        let newDirection: 'asc' | 'desc' | 'none' = 'asc'

        if (currentDirection === 'asc') {
          newDirection = 'desc'
        } else if (currentDirection === 'desc') {
          newDirection = 'none'
        }

        return newDirection === 'none'
          ? []
          : [{ key: columnKey, direction: newDirection }]
      }
    })

    // Announce to screen readers
    const direction = sortConfigs.find(config => config.key === columnKey)?.direction || 'none'
    const nextDirection = direction === 'none' ? 'ascending' : direction === 'asc' ? 'descending' : 'none'
    setSortAnnouncement(`Sorted by ${column.label} ${nextDirection}`)
  }, [columns, multiSort, sortConfigs])

  // Handle filtering
  const handleFilter = useCallback((columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }))
    setCurrentPage(1)
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({})
    setCurrentPage(1)
  }, [])

  // Handle selection
  const toggleRowSelection = useCallback((rowId: any) => {
    setSelectedRows(prev => {
      const newSelection = prev.includes(rowId)
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]

      onSelectionChange?.(newSelection)
      return newSelection
    })
  }, [onSelectionChange])

  const toggleSelectAll = useCallback(() => {
    const allRowIds = filteredData.map(row => row[keyField])
    const allSelected = allRowIds.every(id => selectedRows.includes(id))

    const newSelection = allSelected ? [] : allRowIds
    setSelectedRows(newSelection)
    onSelectionChange?.(newSelection)
  }, [filteredData, selectedRows, keyField, onSelectionChange])

  // Process data with filtering and sorting
  const filteredData = useMemo(() => {
    if (!data?.length) return []

    let result = data.filter(row => {
      if (!row) return false

      return Object.entries(filters).every(([columnKey, filterValue]) => {
        if (!filterValue) return true
        const cellValue = row[columnKey]
        return cellValue?.toString().toLowerCase().includes(filterValue.toLowerCase()) ?? false
      })
    })

    // Apply sorting
    if (sortConfigs.length > 0) {
      result.sort((a, b) => {
        for (const config of sortConfigs) {
          const aVal = a[config.key]
          const bVal = b[config.key]

          if (aVal == null && bVal == null) continue
          if (aVal == null) return 1
          if (bVal == null) return -1

          let comparison = 0
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal)
          } else {
            comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          }

          if (comparison !== 0) {
            return config.direction === 'asc' ? comparison : -comparison
          }
        }
        return 0
      })
    }

    return result
  }, [data, filters, sortConfigs])

  // Announce filter results
  useEffect(() => {
    if (Object.keys(filters).some(key => filters[key])) {
      setFilterAnnouncement(`Showing ${filteredData.length} of ${data?.length || 0} results`)
    } else {
      setFilterAnnouncement('')
    }
  }, [filteredData, data, filters])

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination?.showPagination) return filteredData

    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const rows = tableRef.current?.querySelectorAll('tbody tr')
      if (rows && rows.length > 0) {
        const firstRow = rows[0] as HTMLElement
        firstRow.focus()
      }
    }
  }, [])

  // Handle bulk actions
  const handleBulkAction = useCallback((actionKey: string) => {
    const action = bulkActions.find(a => a.key === actionKey)
    if (action) {
      const selectedRowData = selectedRows.map(id =>
        filteredData.find(row => row[keyField] === id)
      ).filter(Boolean)
      action.action(actionKey, selectedRowData)
    }
  }, [bulkActions, selectedRows, filteredData, keyField])

  // Error handling for invalid configurations
  if (!columns?.length) {
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400">
        Column configuration error
      </div>
    )
  }

  if (data?.length && !data.every(row => row && row.hasOwnProperty(keyField))) {
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400">
        Table configuration error
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        data-testid="table-skeleton"
        className="animate-pulse"
        aria-label="Loading table data"
      >
        <div className="space-y-3">
          {/* Header skeleton */}
          <div className="flex space-x-4">
            {columns.map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            ))}
          </div>
          {/* Row skeletons */}
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex space-x-4">
              {columns.map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (!filteredData?.length) {
    return (
      <div
        data-testid="empty-table-state"
        className="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {columns.filter(col => col.filterable).map((column) => (
            <div key={column.key}>
              <input
                type="text"
                placeholder={`Filter by ${column.label.toLowerCase()}`}
                value={filters[column.key] || ''}
                onChange={(e) => handleFilter(column.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          ))}
          {Object.keys(filters).some(key => filters[key]) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                       bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                       rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Selection toolbar */}
      {selectable && selectedRows.length > 0 && bulkActions.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex space-x-2">
            {bulkActions.map((action) => (
              <button
                key={action.key}
                onClick={() => handleBulkAction(action.key)}
                className="px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300
                         bg-blue-100 dark:bg-blue-800 rounded-md hover:bg-blue-200
                         dark:hover:bg-blue-700 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table container */}
      <div
        data-testid="table-container"
        className={`overflow-x-auto ${responsive ? 'responsive-table' : ''} ${stackOnMobile ? 'stack-on-mobile' : ''}`}
      >
        <table
          ref={tableRef}
          className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${responsive ? 'responsive-table' : ''} ${stackOnMobile ? 'stack-on-mobile' : ''}`}
          role="table"
          aria-label="Data table"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr role="row">
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={filteredData.length > 0 && filteredData.every(row => selectedRows.includes(row[keyField]))}
                    onChange={toggleSelectAll}
                    aria-label="Select all rows"
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
              )}
              {columns.map((column) => {
                const sortConfig = sortConfigs.find(config => config.key === column.key)
                const sortDirection = sortConfig?.direction || 'none'

                return (
                  <th
                    key={column.key}
                    role="columnheader"
                    aria-sort={sortDirection}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
                              ${column.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''}
                              ${column.width ? `w-${column.width}` : ''}`}
                    onClick={() => column.sortable && handleSort(column.key)}
                    tabIndex={column.sortable ? 0 : -1}
                    onKeyDown={(e) => {
                      if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        handleSort(column.key)
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <span className="flex-shrink-0">
                          {sortDirection === 'asc' && (
                            <ChevronUp data-testid="sort-asc-icon" className="w-4 h-4" />
                          )}
                          {sortDirection === 'desc' && (
                            <ChevronDown data-testid="sort-desc-icon" className="w-4 h-4" />
                          )}
                          {sortDirection === 'none' && (
                            <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((row, index) => (
              <tr
                key={row[keyField]}
                role="row"
                tabIndex={0}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 focus:outline-none"
              >
                {selectable && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row[keyField])}
                      onChange={() => toggleRowSelection(row[keyField])}
                      aria-label={`Select row ${index + 1}`}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination?.showPagination && totalPages > 1 && (
        <nav role="navigation" aria-label="Pagination" className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages} ({filteredData.length} total results)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Screen reader announcements */}
      {sortAnnouncement && (
        <div role="status" aria-live="polite" className="sr-only">
          {sortAnnouncement}
        </div>
      )}
      {filterAnnouncement && (
        <div role="status" aria-live="polite" className="sr-only">
          {filterAnnouncement}
        </div>
      )}
    </div>
  )
}