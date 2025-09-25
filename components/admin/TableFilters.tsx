'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { X, Search, Filter, RotateCcw } from 'lucide-react'

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number'
  options?: Array<{ value: string | number; label: string }>
  placeholder?: string
  width?: string
  searchable?: boolean
}

export interface FilterValue {
  [key: string]: any
}

export interface TableFiltersProps {
  fields: FilterField[]
  values: FilterValue
  onChange: (values: FilterValue) => void
  onClear?: () => void
  showClearAll?: boolean
  showFilterCount?: boolean
  compact?: boolean
  className?: string
  disabled?: boolean
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  fields,
  values,
  onChange,
  onClear,
  showClearAll = true,
  showFilterCount = true,
  compact = false,
  className = '',
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact)

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return Object.keys(values).filter(key => {
      const value = values[key]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== null && value !== ''
    }).length
  }, [values])

  const handleFieldChange = useCallback((key: string, value: any) => {
    onChange({
      ...values,
      [key]: value
    })
  }, [values, onChange])

  const clearField = useCallback((key: string) => {
    const newValues = { ...values }
    delete newValues[key]
    onChange(newValues)
  }, [values, onChange])

  const clearAllFilters = useCallback(() => {
    onChange({})
    if (onClear) {
      onClear()
    }
  }, [onChange, onClear])

  const renderFilterField = (field: FilterField) => {
    const value = values[field.key]
    const fieldId = `filter-${field.key}`

    const commonInputClass = `
      w-full px-3 py-2 text-sm border rounded-md
      border-gray-300 dark:border-gray-600
      bg-white dark:bg-gray-800
      text-gray-900 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      focus:border-transparent
      disabled:opacity-50 disabled:cursor-not-allowed
      disabled:bg-gray-100 dark:disabled:bg-gray-700
    `

    switch (field.type) {
      case 'text':
        return (
          <div className="relative">
            <input
              id={fieldId}
              type="text"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder || `Filter by ${field.label.toLowerCase()}`}
              disabled={disabled}
              className={`${commonInputClass} ${value ? 'pr-8' : ''}`}
            />
            {value && (
              <button
                type="button"
                onClick={() => clearField(field.key)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={`Clear ${field.label} filter`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )

      case 'select':
        return (
          <select
            id={fieldId}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={disabled}
            className={commonInputClass}
          >
            <option value="">
              {field.placeholder || `All ${field.label.toLowerCase()}`}
            </option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="relative">
            <select
              id={fieldId}
              multiple
              value={selectedValues}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                handleFieldChange(field.key, selectedOptions)
              }}
              disabled={disabled}
              className={`${commonInputClass} min-h-[2.5rem]`}
              size={Math.min(field.options?.length || 3, 4)}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedValues.length > 0 && (
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => clearField(field.key)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={`Clear ${field.label} filter`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )

      case 'number':
        return (
          <div className="relative">
            <input
              id={fieldId}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value ? Number(e.target.value) : '')}
              placeholder={field.placeholder || `Filter by ${field.label.toLowerCase()}`}
              disabled={disabled}
              className={`${commonInputClass} ${value ? 'pr-8' : ''}`}
            />
            {value && (
              <button
                type="button"
                onClick={() => clearField(field.key)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={`Clear ${field.label} filter`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )

      case 'date':
        return (
          <div className="relative">
            <input
              id={fieldId}
              type="date"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              disabled={disabled}
              className={`${commonInputClass} ${value ? 'pr-8' : ''}`}
            />
            {value && (
              <button
                type="button"
                onClick={() => clearField(field.key)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={`Clear ${field.label} filter`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const gridCols = compact ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Filters
          </h3>
          {showFilterCount && activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
              {activeFilterCount} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {compact && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          )}

          {showClearAll && activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={disabled}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter fields */}
      {(!compact || isExpanded) && (
        <div
          className={`grid ${gridCols} gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700`}
        >
          {fields.map((field) => (
            <div key={field.key} className={field.width || 'w-full'}>
              <label
                htmlFor={`filter-${field.key}`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {field.label}
              </label>
              {renderFilterField(field)}
            </div>
          ))}
        </div>
      )}

      {/* Active filters summary (compact mode) */}
      {compact && !isExpanded && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(values).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null

            const field = fields.find(f => f.key === key)
            if (!field) return null

            let displayValue = value
            if (Array.isArray(value)) {
              displayValue = value.length === 1 ? value[0] : `${value.length} selected`
            }

            return (
              <div
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md"
              >
                <span className="font-medium">{field.label}:</span>
                <span>{displayValue}</span>
                <button
                  type="button"
                  onClick={() => clearField(key)}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                  aria-label={`Remove ${field.label} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {activeFilterCount > 0
          ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} applied`
          : 'No filters applied'
        }
      </div>
    </div>
  )
}