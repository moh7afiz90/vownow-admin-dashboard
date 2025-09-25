'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/Calendar'
import {
  format,
  isValid,
  isBefore,
  isAfter,
  differenceInDays,
  addDays,
  subDays,
  isToday,
  differenceInCalendarDays
} from 'date-fns'

export interface DateRange {
  from?: Date
  to?: Date
}

export interface DateRangePreset {
  label: string
  value: number
}

export interface DateRangePickerProps {
  value?: DateRange
  onDateRangeChange?: (range: DateRange) => void
  placeholder?: string
  dateFormat?: string
  separator?: string
  minDate?: Date
  maxDate?: Date
  maxRangeDays?: number
  minRangeDays?: number
  presets?: DateRangePreset[]
  locale?: string
  showRelative?: boolean
  disabled?: boolean
  className?: string
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onDateRangeChange,
  placeholder = 'Select date range',
  dateFormat = 'yyyy-MM-dd',
  separator = ' - ',
  minDate,
  maxDate,
  maxRangeDays,
  minRangeDays,
  presets = [],
  locale = 'en-US',
  showRelative = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [announcement, setAnnouncement] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update input value when value prop changes
  useEffect(() => {
    if (value?.from && value?.to) {
      if (isValid(value.from) && isValid(value.to)) {
        const fromStr = format(value.from, dateFormat)
        const toStr = format(value.to, dateFormat)
        setInputValue(`${fromStr}${separator}${toStr}`)
        setError('')
      } else {
        setError('Invalid date range')
        setInputValue('')
      }
    } else if (value?.from) {
      if (isValid(value.from)) {
        const fromStr = format(value.from, dateFormat)
        setInputValue(fromStr)
        setError('')
      } else {
        setError('Invalid date range')
        setInputValue('')
      }
    } else {
      setInputValue('')
      setError('')
    }
  }, [value, dateFormat, separator])

  // Validate date range
  const validateRange = useCallback((range: DateRange): string => {
    if (!range.from || !range.to) return ''

    if (!isValid(range.from) || !isValid(range.to)) {
      return 'Invalid date range'
    }

    if (isAfter(range.from, range.to)) {
      return 'End date must be after start date'
    }

    if (minDate && isBefore(range.from, minDate)) {
      return 'Start date is too early'
    }

    if (maxDate && isAfter(range.to, maxDate)) {
      return 'End date is too late'
    }

    const daysDiff = differenceInDays(range.to, range.from)

    if (maxRangeDays && daysDiff > maxRangeDays) {
      return `Date range cannot exceed ${maxRangeDays} days`
    }

    if (minRangeDays && daysDiff < minRangeDays) {
      return `Date range must be at least ${minRangeDays} days`
    }

    return ''
  }, [minDate, maxDate, maxRangeDays, minRangeDays])

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (!value?.from || (value.from && value.to)) {
      // Start new range
      const newRange = { from: date, to: undefined }
      onDateRangeChange?.(newRange)
      setAnnouncement('Start date selected')
    } else {
      // Complete range
      const newRange = isBefore(date, value.from)
        ? { from: date, to: value.from }
        : { from: value.from, to: date }

      const validationError = validateRange(newRange)
      if (validationError) {
        setError(validationError)
        return
      }

      onDateRangeChange?.(newRange)
      setAnnouncement('Date range selected')
      setIsOpen(false)
    }
  }

  // Handle preset selection
  const handlePresetSelect = (preset: DateRangePreset) => {
    const to = new Date()
    const from = subDays(to, preset.value)
    const newRange = { from, to }

    const validationError = validateRange(newRange)
    if (validationError) {
      setError(validationError)
      return
    }

    onDateRangeChange?.(newRange)
    setAnnouncement(`${preset.label} selected`)
    setIsOpen(false)
  }

  // Debounce input change handler
  const debouncedInputChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (inputVal: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          if (!inputVal) {
            onDateRangeChange?.({ from: undefined, to: undefined })
            setError('')
            return
          }

          // Simple validation for manual input
          if (inputVal.includes(separator)) {
            const [fromStr, toStr] = inputVal.split(separator)
            try {
              const from = new Date(fromStr.trim())
              const to = new Date(toStr.trim())

              if (!isValid(from) || !isValid(to)) {
                setError('Invalid date range')
                return
              }

              const range = { from, to }
              const validationError = validateRange(range)
              if (validationError) {
                setError(validationError)
                return
              }

              onDateRangeChange?.(range)
              setError('')
            } catch {
              setError('Invalid date range')
            }
          } else {
            setError('Invalid date range')
          }
        }, 300)
      }
    })()
    ,
    [onDateRangeChange, separator, validateRange]
  )

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value
    setInputValue(inputVal)
    debouncedInputChange(inputVal)
  }

  // Handle clear
  const handleClear = () => {
    onDateRangeChange?.({ from: undefined, to: undefined })
    setInputValue('')
    setError('')
    setAnnouncement('Date range cleared')
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Check if date should be disabled in calendar
  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return true
    if (maxDate && isAfter(date, maxDate)) return true
    return false
  }

  // Check if dates should show as relative
  const relativeDisplay = useMemo(() => {
    if (!showRelative || !value?.from || !value?.to) return null

    const daysDiff = differenceInCalendarDays(new Date(), value.from)
    const rangeDiff = differenceInCalendarDays(value.to, value.from)

    if (daysDiff === rangeDiff && daysDiff === 7) return 'Last 7 days'
    if (daysDiff === rangeDiff && daysDiff === 30) return 'Last 30 days'
    if (daysDiff === rangeDiff && daysDiff === 90) return 'Last 90 days'

    return null
  }, [showRelative, value])

  const hasError = error !== ''
  const hasValue = value?.from || value?.to

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={relativeDisplay || inputValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 border rounded-md
            ${hasError
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Select date range"
          aria-expanded={isOpen}
          aria-invalid={hasError}
          aria-describedby={hasError ? 'date-range-error' : undefined}
        />

        {/* Calendar icon */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:hover:text-gray-400"
          aria-label="Open calendar"
        >
          <CalendarIcon data-testid="calendar-icon" className="w-4 h-4" />
        </button>

        {/* Clear button */}
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear date range"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <div id="date-range-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Calendar popup */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="p-4">
            {/* Presets */}
            {presets.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetSelect(preset)}
                      className="px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar */}
            <Calendar
              selected={value?.from ? (value?.to ? [value.from, value.to] : [value.from]) : undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              mode="range"
              data-min-date={minDate?.toISOString()}
              data-max-date={maxDate?.toISOString()}
            />
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      {announcement && (
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>
      )}

      {/* Relative display indicator */}
      {relativeDisplay && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {relativeDisplay}
        </div>
      )}
    </div>
  )
}