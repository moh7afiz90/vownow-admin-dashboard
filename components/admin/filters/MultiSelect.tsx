'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ChevronDown, X, Check, Search } from 'lucide-react'

export interface MultiSelectOption {
  value: string | number
  label: string
  disabled?: boolean
  description?: string
  group?: string
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: (string | number)[]
  onChange: (value: (string | number)[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  clearable?: boolean
  searchable?: boolean
  maxSelected?: number
  showCount?: boolean
  closeOnSelect?: boolean
  groupBy?: boolean
  className?: string
  error?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search options...',
  disabled = false,
  clearable = true,
  searchable = true,
  maxSelected,
  showCount = true,
  closeOnSelect = false,
  groupBy = false,
  className = '',
  error
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options

    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  // Group options if enabled
  const groupedOptions = useMemo(() => {
    if (!groupBy) return { 'All': filteredOptions }

    return filteredOptions.reduce((groups, option) => {
      const group = option.group || 'Other'
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(option)
      return groups
    }, {} as Record<string, MultiSelectOption[]>)
  }, [filteredOptions, groupBy])

  const selectedOptions = useMemo(() => {
    return options.filter(option => value.includes(option.value))
  }, [options, value])

  const isOptionSelected = useCallback((optionValue: string | number) => {
    return value.includes(optionValue)
  }, [value])

  const handleOptionToggle = useCallback((optionValue: string | number, optionDisabled?: boolean) => {
    if (disabled || optionDisabled) return

    const isCurrentlySelected = value.includes(optionValue)

    if (isCurrentlySelected) {
      // Remove from selection
      const newValue = value.filter(v => v !== optionValue)
      onChange(newValue)
    } else {
      // Add to selection (check max limit)
      if (maxSelected && value.length >= maxSelected) {
        return
      }
      const newValue = [...value, optionValue]
      onChange(newValue)
    }

    if (closeOnSelect) {
      setIsOpen(false)
    }
  }, [value, onChange, disabled, maxSelected, closeOnSelect])

  const handleSelectAll = useCallback(() => {
    if (disabled) return

    const availableOptions = filteredOptions.filter(option => !option.disabled)
    const allValues = availableOptions.map(option => option.value)

    if (maxSelected) {
      const limitedValues = allValues.slice(0, maxSelected)
      onChange(limitedValues)
    } else {
      onChange(allValues)
    }
  }, [filteredOptions, onChange, disabled, maxSelected])

  const handleClearAll = useCallback(() => {
    if (disabled) return
    onChange([])
  }, [onChange, disabled])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => {
          const maxIndex = filteredOptions.length - 1
          return prev >= maxIndex ? 0 : prev + 1
        })
        break

      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => {
          const maxIndex = filteredOptions.length - 1
          return prev <= 0 ? maxIndex : prev - 1
        })
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          const option = filteredOptions[focusedIndex]
          handleOptionToggle(option.value, option.disabled)
        } else {
          setIsOpen(!isOpen)
        }
        break

      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        setFocusedIndex(-1)
        break

      case 'Backspace':
        if (!searchTerm && value.length > 0) {
          // Remove last selected item
          const newValue = value.slice(0, -1)
          onChange(newValue)
        }
        break
    }
  }, [disabled, isOpen, focusedIndex, filteredOptions, handleOptionToggle, searchTerm, value, onChange])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  // Scroll to focused item
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: 'nearest'
        })
      }
    }
  }, [focusedIndex])

  const displayText = useMemo(() => {
    if (value.length === 0) {
      return placeholder
    }

    if (value.length === 1) {
      const selected = selectedOptions[0]
      return selected?.label || `${value.length} selected`
    }

    if (showCount) {
      return `${value.length} selected`
    }

    return selectedOptions.map(opt => opt.label).join(', ')
  }, [value.length, selectedOptions, placeholder, showCount])

  const hasError = Boolean(error)

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-left
          border rounded-md transition-colors
          ${hasError
            ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
          }
          ${disabled
            ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50'
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          }
          focus:outline-none focus:ring-2 focus:ring-opacity-50
          text-gray-900 dark:text-white
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Select from ${options.length} options. ${value.length} selected.`}
      >
        <span className={value.length === 0 ? 'text-gray-500 dark:text-gray-400' : ''}>
          {displayText}
        </span>

        <div className="flex items-center gap-2">
          {clearable && value.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClearAll()
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              aria-label="Clear all selections"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Error message */}
      {error && (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search */}
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setFocusedIndex(-1)
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                />
              </div>
            </div>
          )}

          {/* Select All / Clear All */}
          {filteredOptions.length > 1 && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-600 flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={!!maxSelected && value.length >= maxSelected}
                className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={value.length === 0}
                className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Options */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                {searchTerm ? 'No options found' : 'No options available'}
              </div>
            ) : (
              <ul ref={listRef} role="listbox" className="py-1">
                {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                  <div key={groupName}>
                    {groupBy && Object.keys(groupedOptions).length > 1 && (
                      <li className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700">
                        {groupName}
                      </li>
                    )}

                    {groupOptions.map((option, index) => {
                      const globalIndex = filteredOptions.findIndex(opt => opt.value === option.value)
                      const isSelected = isOptionSelected(option.value)
                      const isFocused = globalIndex === focusedIndex
                      const isDisabled = option.disabled || disabled

                      return (
                        <li key={option.value} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={() => handleOptionToggle(option.value, option.disabled)}
                            disabled={isDisabled}
                            className={`
                              w-full flex items-center px-3 py-2 text-sm text-left
                              ${isFocused ? 'bg-gray-100 dark:bg-gray-700' : ''}
                              ${isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-900 dark:text-white'
                              }
                              ${isDisabled
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }
                              transition-colors
                            `}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{option.label}</div>
                                {option.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {option.description}
                                  </div>
                                )}
                              </div>

                              {isSelected && (
                                <Check className="w-4 h-4 ml-2 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </div>
                ))}
              </ul>
            )}
          </div>

          {/* Footer info */}
          {maxSelected && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
              {value.length} of {maxSelected} selected
            </div>
          )}
        </div>
      )}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {value.length > 0 && `${value.length} option${value.length === 1 ? '' : 's'} selected`}
      </div>
    </div>
  )
}