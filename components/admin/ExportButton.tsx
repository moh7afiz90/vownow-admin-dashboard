'use client'

import React, { useState, useCallback } from 'react'
import { Download, FileText, Database, Image, ChevronDown, Loader2 } from 'lucide-react'

export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf' | 'png'

export interface ExportOption {
  format: ExportFormat
  label: string
  icon?: React.ComponentType<{ className?: string }>
  description?: string
  disabled?: boolean
}

export interface ExportButtonProps {
  onExport: (format: ExportFormat, options?: ExportOptions) => Promise<void> | void
  formats?: ExportFormat[]
  customOptions?: ExportOption[]
  variant?: 'button' | 'dropdown' | 'split'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  showProgress?: boolean
  selectedCount?: number
  totalCount?: number
}

export interface ExportOptions {
  includeHeaders?: boolean
  selectedOnly?: boolean
  dateFormat?: string
  filename?: string
}

const defaultExportOptions: Record<ExportFormat, ExportOption> = {
  csv: {
    format: 'csv',
    label: 'CSV',
    icon: FileText,
    description: 'Comma-separated values file'
  },
  xlsx: {
    format: 'xlsx',
    label: 'Excel',
    icon: FileText,
    description: 'Microsoft Excel spreadsheet'
  },
  json: {
    format: 'json',
    label: 'JSON',
    icon: Database,
    description: 'JavaScript Object Notation'
  },
  pdf: {
    format: 'pdf',
    label: 'PDF',
    icon: FileText,
    description: 'Portable Document Format'
  },
  png: {
    format: 'png',
    label: 'PNG',
    icon: Image,
    description: 'Portable Network Graphics image'
  }
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  formats = ['csv', 'xlsx', 'json'],
  customOptions,
  variant = 'dropdown',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  showProgress = false,
  selectedCount = 0,
  totalCount = 0
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeHeaders: true,
    selectedOnly: false,
    dateFormat: 'yyyy-MM-dd'
  })

  const availableOptions = customOptions || formats.map(format => defaultExportOptions[format])

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const baseButtonClass = `
    inline-flex items-center justify-center font-medium rounded-md
    border border-gray-300 dark:border-gray-600
    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
    hover:bg-gray-50 dark:hover:bg-gray-700
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:hover:bg-white dark:disabled:hover:bg-gray-800
  `

  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      setExportingFormat(format)
      await onExport(format, exportOptions)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExportingFormat(null)
      setIsDropdownOpen(false)
    }
  }, [onExport, exportOptions])

  const isLoading = loading || exportingFormat !== null

  if (variant === 'button' && availableOptions.length === 1) {
    const option = availableOptions[0]
    const Icon = option.icon || Download

    return (
      <button
        onClick={() => handleExport(option.format)}
        disabled={disabled || isLoading}
        className={`${baseButtonClass} ${sizeClasses[size]} ${className}`}
        title={option.description}
        aria-label={`Export as ${option.label}`}
      >
        {isLoading && exportingFormat === option.format ? (
          <Loader2 className={`${iconSizeClasses[size]} animate-spin mr-2`} />
        ) : (
          <Icon className={`${iconSizeClasses[size]} mr-2`} />
        )}
        Export {option.label}
      </button>
    )
  }

  if (variant === 'split') {
    const defaultOption = availableOptions[0]
    const Icon = defaultOption.icon || Download

    return (
      <div className="inline-flex">
        <button
          onClick={() => handleExport(defaultOption.format)}
          disabled={disabled || isLoading}
          className={`${baseButtonClass} rounded-r-none border-r-0 ${sizeClasses[size]}`}
          title={defaultOption.description}
          aria-label={`Export as ${defaultOption.label}`}
        >
          {isLoading && exportingFormat === defaultOption.format ? (
            <Loader2 className={`${iconSizeClasses[size]} animate-spin mr-2`} />
          ) : (
            <Icon className={`${iconSizeClasses[size]} mr-2`} />
          )}
          Export {defaultOption.label}
        </button>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled || isLoading}
            className={`${baseButtonClass} rounded-l-none ${sizeClasses[size]} px-2`}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            aria-label="Export options"
          >
            <ChevronDown className={`${iconSizeClasses[size]} transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                <div className="py-1" role="menu">
                  {availableOptions.slice(1).map((option) => {
                    const Icon = option.icon || Download
                    return (
                      <button
                        key={option.format}
                        onClick={() => handleExport(option.format)}
                        disabled={option.disabled || isLoading}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        role="menuitem"
                      >
                        {isLoading && exportingFormat === option.format ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-3" />
                        ) : (
                          <Icon className="w-4 h-4 mr-3" />
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Default dropdown variant
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={disabled || isLoading}
        className={`${baseButtonClass} ${sizeClasses[size]} ${className}`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="menu"
        aria-label="Export data"
      >
        {isLoading ? (
          <Loader2 className={`${iconSizeClasses[size]} animate-spin mr-2`} />
        ) : (
          <Download className={`${iconSizeClasses[size]} mr-2`} />
        )}
        Export
        <ChevronDown className={`${iconSizeClasses[size]} ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Export Options
              </h3>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeHeaders}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include headers</span>
                </label>

                {selectedCount > 0 && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.selectedOnly}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, selectedOnly: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Export selected only ({selectedCount} of {totalCount})
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className="py-1" role="menu">
              {availableOptions.map((option) => {
                const Icon = option.icon || Download
                return (
                  <button
                    key={option.format}
                    onClick={() => handleExport(option.format)}
                    disabled={option.disabled || isLoading}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    role="menuitem"
                  >
                    {isLoading && exportingFormat === option.format ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-3" />
                    ) : (
                      <Icon className="w-4 h-4 mr-3" />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Progress indicator */}
      {showProgress && isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2">
            <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Exporting {exportingFormat}...
            </div>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {isLoading ? `Exporting ${exportingFormat}` : ''}
      </div>
    </div>
  )
}